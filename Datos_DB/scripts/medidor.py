import os
import csv
import json
import psycopg2
from datetime import datetime


def find_posicion(archivos):
    for i, archivo in enumerate(archivos):
        if "CURRENT BILLING" in archivo:
            return archivos[i]


def generate_sql_medidor(data):

    reading = data[1][1]

    # Dividir los datos del reading
    sub_reading = reading.split(' ')

    meter_type = sub_reading[0]
    zone = sub_reading[1]
    meter_id = sub_reading[2].split('-')[1]
    meter_data = data[0][1]

    sql = f"INSERT INTO medidor (id, zone, meterExtra, type) VALUES ({meter_id}, '{zone}', '{meter_data}', '{meter_type}') ON CONFLICT (id) DO UPDATE SET zone = EXCLUDED.zone, meterExtra = EXCLUDED.meterExtra, type = EXCLUDED.type;"

    return sql


def generate_meter_readings(dataFinal):
    dataReading = []
    for data in dataFinal:
        if data[0] == 'Meter:':
            subdata = [data]
            dataReading.append(subdata)
        else:
            subdata.append(data)

    return dataReading


def generate_sql(dataFinal):

    # Crear data lectura
    data_readings = generate_meter_readings(dataFinal)

    for data in data_readings:

        # generate data sql meter
        sql_medidor = generate_sql_medidor(data)
        set_data_db(sql_medidor)


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
        # print(sql_lectura)

        # Confirmación de la transacción
        conexion.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error al conectar a la base de datos PostgreSQL:", error)

    finally:
        # Cierre de la comunicación con PostgreSQL
        if conexion:
            cur.close()
            conexion.close()


def get_data_meter():
    # Obtener la ruta de la carpeta principal
    # Reemplaza esto con la ruta de tu carpeta principal
    ruta_principal = "C:/Users/sebas/OneDrive - Universidad de los andes/0. AnalíticaGEB/caso_electrodunas/Información Caso de uso  Electrodunas/Lectura por mes"

    # Obtener la lista de carpetas en la carpeta principal
    carpetas = os.listdir(ruta_principal)

    carpetas_filtradas = [
        carpeta for carpeta in carpetas if "PRN" not in carpeta]

    # Recorrer cada carpeta

    for carpeta in carpetas_filtradas:
        ruta_carpeta = ruta_principal + "/" + carpeta
        # Verificar si es una carpeta válida
        if os.path.isdir(ruta_carpeta):
            archivos = os.listdir(ruta_carpeta)

            archivo_actual = ruta_carpeta + "/" + find_posicion(archivos)

            # Verificar si el archivo "CURRENT BILLING" existe en la carpeta actual
            if os.path.isfile(archivo_actual):
                datos = []

                # Abrir el archivo y leer los datos
                with open(archivo_actual, newline='') as archivo:
                    lector = csv.reader(archivo, delimiter='\t')
                    for fila in lector:
                        datos.append(fila)

                dataFinal = [dato for dato in datos if dato != []]
                generate_sql(dataFinal)
