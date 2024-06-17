import os
import csv
import json
import psycopg2
from datetime import datetime


def find_posicion(archivos):
    for i, archivo in enumerate(archivos):
        if "CURRENT BILLING" in archivo:
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


def generate_indices(data):

    indices = [4,  5,  6,  7, 8,
               10, 11, 12, 13, 14,
               16, 17, 18, 19, 20,
               22, 23, 24, 25, 26]
    if len(data) > 27:
        indices += [28, 29, 30, 31, 32,
                    34, 35, 36, 37, 38]

    return indices


def generate_sql_lectura(indices, data):
    sql = '''INSERT INTO reading
    (
    	nis_id, fa_wh_delivered, fa_wh_max_demand_delivered, fa_wh_cumulative_demand_delivered, fa_wh_date_delivered, fb_wh_delivered, fb_wh_max_demand_delivered, fb_wh_cumulative_demand_delivered, fb_wh_date_delivered, fc_wh_delivered, fc_wh_max_demand_delivered, fc_wh_cumulative_demand_delivered, fc_wh_date_delivered, fd_wh_delivered, fd_wh_max_demand_delivered, fd_wh_cumulative_demand_delivered, fd_wh_date_delivered, ft_wh_delivered, ft_wh_max_demand_delivered, ft_wh_cumulative_demand_delivered, ft_wh_date_delivered, fa_varh_delivered, fa_varh_max_demand_delivered, fa_varh_cumulative_demand_delivered, fa_varh_date_delivered, fb_varh_delivered, fb_varh_max_demand_delivered, fb_varh_cumulative_demand_delivered, fb_varh_date_delivered, fc_varh_delivered, fc_varh_max_demand_delivered, fc_varh_cumulative_demand_delivered, fc_varh_date_delivered, fd_varh_delivered, fd_varh_max_demand_delivered, fd_varh_cumulative_demand_delivered, fd_varh_date_delivered, ft_varh_delivered, ft_varh_max_demand_delivered, ft_varh_cumulative_demand_delivered, ft_varh_date_delivered, fa_wh_received, fa_wh_max_demand_received, fa_wh_cumulative_demand_received, fa_wh_date_received, fb_wh_received, fb_wh_max_demand_received, fb_wh_cumulative_demand_received, fb_wh_date_received, fc_wh_received, fc_wh_max_demand_received, fc_wh_cumulative_demand_received, fc_wh_date_received, fd_wh_received, fd_wh_max_demand_received, fd_wh_cumulative_demand_received, fd_wh_date_received, ft_wh_received, ft_wh_max_demand_received, ft_wh_cumulative_demand_received, ft_wh_date_received, fa_varh_received, fa_varh_max_demand_received, fa_varh_cumulative_demand_received, fa_varh_date_received, fb_varh_received, fb_varh_max_demand_received, fb_varh_cumulative_demand_received, fb_varh_date_received, fc_varh_received, fc_varh_max_demand_received, fc_varh_cumulative_demand_received, fc_varh_date_received, fd_varh_received, fd_varh_max_demand_received, fd_varh_cumulative_demand_received, fd_varh_date_received, ft_varh_received, ft_varh_max_demand_received, ft_varh_cumulative_demand_received, ft_varh_date_received'''

    if 38 in indices:
        sql += ", fa_pw_01, fb_pw_01, fc_pw_01, fd_pw_01, ft_pw_01, fa_pw_23, fb_pw_23, fc_pw_23, fd_pw_23, ft_pw_23"

    sql += ") VALUES ("

    # Medidor id
    reading = data[1][1]

    # Dividir los datos del reading
    sub_reading = reading.split(' ')
    meter_id = sub_reading[2].split('-')[1]

    sql += f"{meter_id}, "

    # Creacion de datos

    for i in indices:
        for valores in data[i][1:]:
            # Revisar que esta vacio
            if valores == ' ':
                sql += 'NULL'
            else:
                # Revisar que no sea fecha con el caracter /
                if "/" in valores:
                    date = datetime.strptime(valores, " %d/%m/%Y %H:%M")
                    sql += date.strftime("'%Y-%m-%d %H:%M:%S'")
                else:
                    sql += "'" + valores + "'"
            # Colocar coma
            sql += ', '

    # Eliminar ultima coma y crerrarlo
    sql = sql[:-2] + ");"

    return sql


def generate_sql(dataFinal):

    # Crear data lectura
    data_readings = generate_meter_readings(dataFinal)

    for data in data_readings:

        indices = generate_indices(data)

        # generate data sql lectura
        sql_lectura = generate_sql_lectura(indices, data)
        set_data_db(sql_lectura)


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


def get_data_billing(ruta_informacion):
    # Obtener la ruta de la carpeta principal
    # Reemplaza esto con la ruta de tu carpeta principal

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
