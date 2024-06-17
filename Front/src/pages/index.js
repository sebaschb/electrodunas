import React, { useState, useEffect } from "react";
import BaseLayout from "../components/BaseLayout";
import Map from "../components/Map";
import AlertChart from "../components/AlertChart";
import InfoChart from "@/components/InfoChart";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

async function fetchUsersCount() {
  const res = await fetch(`http://localhost:5000/api/count-users`);
  const data = await res.json();
  return data.count;
}

async function fetchLatestAlertsSummary() {
  const res = await fetch(
    `http://localhost:5000/api/alerts-summary-latest-color-total`
  );
  const data = await res.json();
  return data;
}

const Home = () => {
  const [usersCount, setUsersCount] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);

  useEffect(() => {
    async function getData() {
      try {
        // Obtener la cantidad de usuarios
        const count = await fetchUsersCount();
        setUsersCount(count);

        // Obtener el resumen de alertas
        const alertsSummaryData = await fetchLatestAlertsSummary();
        setAlertsSummary(alertsSummaryData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error fetching data. Please try again later.");
      }
    }

    getData();
  }, []);

  return (
    <BaseLayout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-9">
            <div className="map-container p-3 mb-3 border rounded shadow-sm">
              <h4 className="fw-bold">Mapa de los usuarios</h4>
              <Map />
            </div>
          </div>
          <div className="col-md-3">
            <div className="row">
              <div className="col-md-12 summary-container p-3 mb-3 border rounded shadow-sm">
                <h4 className="fw-bold">Resumen</h4>
                {usersCount !== null ? (
                  <p>
                    <span className="fw-bold">Número de usuarios:</span>{" "}
                    {usersCount}
                  </p>
                ) : (
                  <p>Cargando...</p>
                )}
                <p className="fw-bold">Número de usuarios por alerta:</p>
                {alertsSummary !== null ? (
                  <ul className="list-unstyled">
                    <li>
                      - Baja: <span>{alertsSummary.low}</span>
                    </li>
                    <li>
                      - Media: <span>{alertsSummary.medium}</span>
                    </li>
                    <li>
                      - Alta: <span>{alertsSummary.high}</span>
                    </li>
                  </ul>
                ) : (
                  <p>Cargando...</p>
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-md-12 alerts-container p-3 mb-3 border rounded shadow-sm">
                <InfoChart description="Clasificación del cliente con alerta baja (amarillo), media (naranja) y alta (rojo) según el número máximo de observaciones clasificadas como alertas. Un mismo cliente puede tener observaciones en varios niveles, por ejemplo, una observación con alerta amarilla y dos con alerta naranja; en este caso se clasifica al cliente según la máxima alerta reportada." />
                <h4 className="fw-bold">Alertas</h4>
                <p>
                  Número de usuarios por nivel de alerta en los últimos 7 días.
                </p>
                <AlertChart />
                <div className="container">
                  <p className="text-center">
                    <strong>Fecha de referencia:</strong> 27/02/2023
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </BaseLayout>
  );
};

export default Home;
