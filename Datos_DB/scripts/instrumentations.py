import datetime
import os
import csv
import json
import psycopg2
from datetime import datetime


def find_posicion(archivos):
    for i, archivo in enumerate(archivos):
        if "INSTRUMENT" in archivo:
            return archivos[i]


def generate_meter_readings(dataFinal):
    dataReading = []
    for data in dataFinal:
        if data[0] == 'Meter:':
            subdata = [data]
            dataReading.append(subdata)
        else:
            subdata.append(data)

    return dataReading


def generate_sets_readings(dataFinal):
    dataReading = []
    subdata = []
    for data in dataFinal:
        if 'set' in data[0].lower():
            subdata = [data]
            dataReading.append(subdata)
        else:
            subdata.append(data)

    return dataReading


def generate_dates_readings(dataFinal):
    dataReading = []
    subdata = []
    for data in dataFinal:
        if data[0] == 'No Interval Data.':
            dataReading.append([])

        if data[0] == 'Date:':
            subdata = [data]
            dataReading.append(subdata)
        else:
            subdata.append(data)

    return dataReading


def generate_sql_date(meter_id, set_id, date_id, date):
    sql = ''

    for subdate in date[1:]:
        data_date = subdate[0]
        fa_voltage = subdate[1]
        fb_voltage = subdate[2]
        fc_voltage = subdate[3]
        fa_current = fb_current = fc_current = system_watts = None

        if len(subdate) == 6:
            system_watts = subdate[4]
        elif len(subdate) == 8:
            fa_current = subdate[4]
            fb_current = subdate[5]
            fc_current = subdate[6]
        elif len(subdate) == 9:
            fa_current = subdate[4]
            fb_current = subdate[5]
            fc_current = subdate[6]
            system_watts = subdate[7]

        # Combina la fecha y la hora en un solo campo en el formato '%Y-%m-%d %H:%M:%S'
        combined_datetime = datetime.strptime(
            f"{date_id} {data_date}", "%d/%m/%Y %H:%M").strftime("%Y-%m-%d %H:%M:%S")

        # Construye la consulta SQL basada en los valores disponibles
        sql += f"INSERT INTO instrumentation (nis_id, fa_voltage, fb_voltage, fc_voltage"

        if fa_current is not None and fb_current is not None and fc_current is not None:
            sql += ", fa_current, fb_current, fc_current"
        if system_watts is not None:
            sql += ", system_watts"

        sql += ", set_number, date) VALUES "

        sql += f"({meter_id}, '{fa_voltage}', '{fb_voltage}', '{fc_voltage}'"

        if fa_current is not None and fb_current is not None and fc_current is not None:
            sql += f", '{fa_current}', '{fb_current}', '{fc_current}'"
        if system_watts is not None:
            sql += f", '{system_watts}'"

        sql += f", '{set_id}', '{combined_datetime}');"

    return sql


def set_data_db(sql_lectura):
    """ Conexión al servidor de base de datos PostgreSQL """
    conexion = None
    try:
        # Conexión al servidor de PostgreSQL
        conexion = psycopg2.connect(
            host="pg_container", database="test_db", user="root", password="root")

        # Creación del cursor
        cur = conexion.cursor()

        # Ejecución de la consulta SQL
        cur.execute(sql_lectura)

        # Confirmación de la transacción
        conexion.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error al conectar a la base de datos PostgreSQL:", error)

    finally:
        # Cierre de la comunicación con PostgreSQL
        if conexion:
            cur.close()
            conexion.close()


def generate_sql(dataFinal):

    # Crear data isntrumentations
    data_readings = generate_meter_readings(dataFinal)

    for data in data_readings:

        # Guardar el id del medidor
        reading = data[1][1]
        sub_reading = reading.split(' ')
        meter_id = sub_reading[2].split('-')[1]

        # Crear data sets
        data_sets = generate_sets_readings(data)

        for set in data_sets:
            # Guardar el set
            set_id = set[0][0]

            data_date = generate_dates_readings(set)

            for date in data_date:
                # Revisar que se tengan datos en el set
                if date != []:
                    # Guardar el date
                    date_id = date[0][1]
                    sql_date = generate_sql_date(
                        meter_id, set_id, date_id, date)
                    set_data_db(sql_date)

                # else:
                #     print("vacio")


def get_data_instrumentations(ruta_informacion):
    # Obtener la ruta de la carpeta principal

    # Obtener la lista de carpetas en la carpeta principal
    carpetas = os.listdir(ruta_informacion)

    carpetas_filtradas = [
        carpeta for carpeta in carpetas if "PRN" not in carpeta]

    # Recorrer cada carpeta

    for carpeta in carpetas_filtradas:
        ruta_carpeta = ruta_informacion + "/" + carpeta
        # Verificar si es una carpeta válida
        if os.path.isdir(ruta_carpeta):
            archivos = os.listdir(ruta_carpeta)

            archivo_actual = ruta_carpeta + "/" + find_posicion(archivos)

            # Verificar si el archivo "INSTRUMENTATIOS" existe en la carpeta actual
            if os.path.isfile(archivo_actual):
                datos = []

                # Abrir el archivo y leer los datos
                with open(archivo_actual, newline='') as archivo:
                    lector = csv.reader(archivo, delimiter='\t')
                    for fila in lector:
                        datos.append(fila)

                dataFinal = [dato for dato in datos if dato != []]
                generate_sql(dataFinal)
