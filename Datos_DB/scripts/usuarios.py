import openpyxl
import psycopg2

# Conexión a la base de datos PostgreSQL
connection = psycopg2.connect(
    host="pg_container",
    database="test_db",
    user="root",
    password="root"
)

# Creación del cursor
cursor = connection.cursor()


def insert_user_data(row_data):
    # Ejecución de la consulta SQL para insertar los valores en la tabla "usuario"
    query = """
    INSERT INTO users (
        name, id, names, address, department, province, district, trunk, substation, rate,
        meter_serial_number, model, installed_power_sum, contracted_power_sum,
        ciiu_description, ciiu_code, business_activity, voltage, number_of_wires,
        current_factor_sum, voltage_factor_sum, constant, service_status,
        sed_x_coordinate, sed_y_coordinate
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s
    )
    """

    # Insertar los valores de la fila en la tabla "usuario"
    cursor.execute(query, row_data)

    # Confirmar la transacción
    connection.commit()


def get_data_users(ruta_principal):

    try:

        # Cargar el archivo de Excel
        workbook = openpyxl.load_workbook(ruta_principal)

        # Seleccionar la hoja "MARZO"
        sheet = workbook['MARZO']

        # Recorrer cada fila de la hoja
        for row in sheet.iter_rows(min_row=2, values_only=True):
            insert_user_data(row)

        # Cerrar el cursor y la conexión después de terminar el bucle
        cursor.close()
        connection.close()

    except (Exception, psycopg2.Error) as error:
        print("Error al conectar a la base de datos PostgreSQL:", error)

    finally:
        # Cerrar el cursor y la conexión después de terminar el bucle
        cursor.close()
        connection.close()
