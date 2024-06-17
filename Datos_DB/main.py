from scripts.billing import get_data_billing
from scripts.instrumentations import get_data_instrumentations
from scripts.medidor import get_data_meter
from scripts.usuarios import get_data_users
from scripts.energia import get_data_prn


def main():

    ruta_clientes = "INFORMACION CLIENTES MAYORES .xlsx"
    ruta_informacion = "Lectura por mes"

    # get_data_meter()

    print("Generacion de datos de usuarios ....", flush=True)
    get_data_users(ruta_clientes)

    print("Generacion de datos de lecturas ....", flush=True)
    get_data_billing(ruta_informacion)

    print("Generacion de datos de instrumentacion ....", flush=True)
    get_data_instrumentations(ruta_informacion)

    print("Generacion de datos de prn ....")
    get_data_prn(ruta_informacion)


if __name__ == '__main__':
    main()
