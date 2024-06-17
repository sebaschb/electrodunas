import datetime
import os
import csv
import json
import psycopg2
from datetime import datetime, timedelta
import re


def find_posicion(archivos):
    for i, archivo in enumerate(archivos):
        if ".prn" in archivo.lower():
            return archivos[i]


def get_data_prn(ruta_informacion):
    # Obtener la ruta de la carpeta principal

    # Obtener la lista de carpetas en la carpeta principal
    carpetas = os.listdir(ruta_informacion)

    carpetas_filtradas = [
        carpeta for carpeta in carpetas if "PRN" in carpeta
    ]

    # Recorrer cada carpeta

    for carpeta in carpetas_filtradas:
        ruta_carpeta = ruta_informacion + "/" + carpeta

        nis_id = carpeta.split(" ")[1]
        # print(nis_id)

        # Verificar si es una carpeta válida
        if os.path.isdir(ruta_carpeta):
            archivos = os.listdir(ruta_carpeta)

            for archivo in archivos:

                archivo_actual = ruta_carpeta + "/" + archivo

                if os.path.isfile(archivo_actual):
                    datos = []

                    # Abrir el archivo y leer los datos
                    with open(archivo_actual, newline='') as archivo:
                        lector = csv.reader(archivo, delimiter='\t')
                        for fila in lector:
                            datos.append(fila)

                    dataFinal = [dato for dato in datos if dato != []]
                    generate_sql(dataFinal, nis_id)


def generate_sql(dataFinal, nis_id):
    for data in dataFinal:
        # print(data)

        # Extraer la fecha
        date = datetime.strptime(data[1], "%d/%m/%y")

        time_str = data[2]

        # cambio del dia siguiente
        if time_str == "24:00:00" or time_str == "24:00":
            time_str = "00:00"
            # Añadir un día a la fecha actual
            date += timedelta(days=1)

        time = datetime.strptime(time_str, "%H:%M")
        date_final = datetime.combine(
            date.date(), time.time()).strftime("%Y-%m-%d %H:%M:%S")

        active_energy = data[4]
        reactive_energy = data[5]

        # print(nis_id, date_final, active_energy, reactive_energy)

        # Generar el SQL para la lectura de energía
        sql_lectura = f"INSERT INTO energy (nis_id, date, active_energy, reactive_energy) VALUES ({nis_id}, '{date_final}', '{active_energy}', '{reactive_energy}')"

        # Llamar a la función set_data_db con el SQL generado
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

        # Confirmación de la transacción
        conexion.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error al conectar a la base de datos PostgreSQL:", error)

    finally:
        # Cierre de la comunicación con PostgreSQL
        if conexion:
            cur.close()
            conexion.close()
