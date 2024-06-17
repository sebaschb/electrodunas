import React, { useEffect, useState } from "react";
import { Modal, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Chart } from "chart.js/auto";
import InfoChart from "@/components/InfoChart";

async function fetchAlertDetails(alertId, endDate, numDays) {
  try {
    const res = await fetch(
      `http://localhost:5000/api/users/${alertId}/alerts-summary-by-day?endDate=${endDate}&numDays=${numDays}`
    );
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error("Error al obtener los detalles de la alerta");
  }
}

async function fetchUserData(userId) {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

const AlertDetail = ({ show, handleClose, alert, selectedEndDate }) => {
  const [alertDetails, setAlertDetails] = useState(null);
  const [filter, setFilter] = useState("30");
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function getAlertDetails(alertId) {
      try {
        const fetchedAlertDetails = await fetchAlertDetails(
          parseInt(alertId),
          selectedEndDate,
          parseInt(filter)
        );
        setAlertDetails(fetchedAlertDetails);
      } catch (error) {
        toast.error("Error al cargar los detalles de la alerta");
      }
    }

    async function getUserData(userId) {
      try {
        const fetchedUserData = await fetchUserData(userId);
        setUserData(fetchedUserData);
      } catch (error) {
        toast.error("Error al cargar los datos del usuario");
      }
    }

    if (alert) {
      getAlertDetails(alert);
      getUserData(alert); // Fetch user data using the alert (user) id
    }
  }, [alert, selectedEndDate, filter]);

  useEffect(() => {
    // Función para crear la gráfica
    function createChart() {
      const canvas = document.getElementById("stackedBarChart");
      if (!canvas || !alertDetails) return;

      // Si hay una instancia anterior del gráfico, destruirla antes de crear una nueva
      if (canvas.chart) {
        canvas.chart.destroy();
      }

      const dates = Object.keys(alertDetails);
      const highValues = dates.map((date) => alertDetails[date].high);
      const mediumValues = dates.map((date) => alertDetails[date].medium);
      const lowValues = dates.map((date) => alertDetails[date].low);

      canvas.chart = new Chart(canvas, {
        type: "bar",
        data: {
          labels: dates,
          datasets: [
            {
              label: "Alta",
              data: highValues,
              backgroundColor: "rgb(185, 0, 17)",
            },
            {
              label: "Media",
              data: mediumValues,
              backgroundColor: "rgb(241, 123, 65)",
            },
            {
              label: "Baja",
              data: lowValues,
              backgroundColor: "rgb(255, 191, 65)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              title: {
                display: true,
                text: "Fecha",
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              title: {
                display: true,
                text: "Numero de Alertas",
              },
            },
          },
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: false,
              text: "Alertas por día",
            },
          },
        },
      });
    }

    createChart();
  }, [alertDetails]);

  const handleCloseModal = () => {
    setAlertDetails(null);
    setUserData(null);
    setFilter("30");
    handleClose();
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  return (
    <Modal
      show={show}
      onHide={handleCloseModal}
      dialogClassName="custom-size-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Detalles de la alerta</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="chart-data col-md-9">
            <div className="chart-container border rounded p-3 shadow-sm bg-white">
              <div className="chart-header alerts-container">
                <h4>Información de las alertas</h4>
                <p>
                  Número de observaciones de los últimos {filter} días
                  clasificadas según su nivel de alerta: alta, media y baja,
                  respectivamente
                </p>
                <InfoChart description="Se establecieron tres niveles de alerta: amarilla, naranja y roja. Cada nivel de alerta representa un rango de valores para la energía activa. El nivel amarillo indica que el valor se encuentra fuera del intervalo comprendido entre el 1% y el 99% de probabilidad. El nivel naranja se sitúa fuera del intervalo entre el 0.5% y el 99.5% de probabilidad y el rojo abarca los valores que están fuera del intervalo entre 0.1% y 99.9%. La gráfica representa el número (conteo) de observaciones clasificadas en cada intervalo para cada día." />
              </div>
              <div className="filter-container">
                <label htmlFor="filter-select">Mostrar:</label>
                <select
                  value={filter}
                  onChange={handleFilterChange}
                  className="filter-select"
                >
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>
              <div style={{ height: "550px", marginBottom: "20px" }}>
                <canvas id="stackedBarChart" />
              </div>
            </div>
          </div>
          <div className="col-md-3 chart-energy">
            {userData && (
              <div className="border rounded p-3 shadow-sm bg-white">
                <h5 className="mb-4">Información del usuario</h5>
                <p>La información relacionada con el usuario es:</p>
                <div className="container data-user">
                  <p>
                    <strong> Nombre:</strong> {userData.names}
                  </p>
                  <p>
                    <strong> Dirección:</strong> {userData.address}
                  </p>
                  <p>
                    <strong> Provincia:</strong> {userData.province}
                  </p>
                  <p>
                    <strong> Distrito:</strong> {userData.district}
                  </p>
                  <p>
                    <strong> Departamento:</strong> {userData.department}
                  </p>
                  <p>
                    <strong> NIS:</strong> {userData.id}
                  </p>
                </div>
                <p>La información relacionada con el medidor:</p>
                <div className="container data-meter">
                  <p>
                    <strong> Modelo:</strong> {userData.model}
                  </p>
                  <p>
                    <strong> Numero de medidor:</strong>{" "}
                    {userData.meter_serial_number}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AlertDetail;
