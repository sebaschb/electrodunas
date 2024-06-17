import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

async function fetchEnergy(userId, filter) {
  const queryParams = new URLSearchParams({
    filter: filter,
  });

  const url = `http://localhost:5000/api/users/${userId}/energy?${queryParams.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

const EnergyChart = ({ userId }) => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("day"); // Filtro por defecto: "day"

  useEffect(() => {
    async function getChartData(userId, filter) {
      try {
        const fetchedEnergy = await fetchEnergy(userId, filter);

        // Procesar los datos obtenidos del fetch y construir el objeto de datos para el gráfico
        const labels = Object.keys(fetchedEnergy);
        const activeEnergyData = Object.values(fetchedEnergy).map(
          (entry) => entry.activeEnergy
        );
        const reactiveEnergyData = Object.values(fetchedEnergy).map(
          (entry) => entry.reactiveEnergy
        );

        const activeEnergyUpperLimit = Object.values(fetchedEnergy).map(
          (entry) => entry.activeEnergy + entry.activeEnergyDeviation
        );
        const activeEnergyLowerLimit = Object.values(fetchedEnergy).map(
          (entry) => entry.activeEnergy - entry.activeEnergyDeviation
        );

        const reactiveEnergyUpperLimit = Object.values(fetchedEnergy).map(
          (entry) => entry.reactiveEnergy + entry.reactiveEnergyDeviation
        );
        const reactiveEnergyLowerLimit = Object.values(fetchedEnergy).map(
          (entry) => entry.reactiveEnergy - entry.reactiveEnergyDeviation
        );

        const data = {
          labels: labels,
          datasets: [
            {
              label: "Energía Activa",
              data: activeEnergyData,
              fill: false,
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              tension: 0.1,
              zIndex: 2,
            },
            {
              label: "Límite Superior de Energía Activa",
              data: activeEnergyUpperLimit,
              fill: "+1",
              borderColor: "rgba(0, 0, 255, 0.3)",
              tension: 0.1,
              borderWidth: 1,
              zIndex: 1,
            },
            {
              label: "Límite Inferior de Energía Activa",
              data: activeEnergyLowerLimit,
              fill: "-1",
              borderColor: "rgba(0, 0, 255, 0.3)",
              tension: 0.1,
              borderWidth: 1,
              zIndex: 1,
            },
            {
              label: "Energía Reactiva",
              data: reactiveEnergyData,
              fill: false,
              borderColor: "rgba(255, 0, 0, 1)",
              borderWidth: 2,
              tension: 0.1,
              zIndex: 2,
            },
            {
              label: "Límite Superior de Energía Reactiva",
              data: reactiveEnergyUpperLimit,
              fill: "+1",
              borderColor: "rgba(255, 99, 132, 0.3)",
              tension: 0.1,
              borderWidth: 1,
              zIndex: 1,
            },
            {
              label: "Límite Inferior de Energía Reactiva",
              data: reactiveEnergyLowerLimit,
              fill: "-1",
              borderColor: "rgba(255, 99, 132, 0.3)",
              tension: 0.1,
              borderWidth: 1,
              zIndex: 1,
            },
          ],
        };

        setChartData(data);

        if (Object.keys(fetchedEnergy).length === 0) {
          toast.info(`No hay datos asociados al usuario con ID ${userId}`);
        }

        setError(false);
      } catch (error) {
        setChartData(null);
        setError(true);
      }
    }

    if (userId) {
      getChartData(userId, filter);
    }
  }, [userId, filter]);

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Obtener los títulos de los ejes dinámicamente en función del filtro seleccionado
  const getAxisTitles = (filter) => {
    let xAxisTitle, yAxisTitle, yAxisTitleRight;

    switch (filter) {
      case "day":
        xAxisTitle = "Horas del dia";
        yAxisTitle = "Energía Activa (kWh)";
        yAxisTitleRight = "Energía Reactiva (kVArh)";
        break;
      case "week":
        xAxisTitle = "Días de la semana";
        yAxisTitle = "Energía Activa (kWh)";
        yAxisTitleRight = "Energía Reactiva (kVArh)";
        break;
      case "month":
        xAxisTitle = "Días del mes";
        yAxisTitle = "Energía Activa (kWh)";
        yAxisTitleRight = "Energía Reactiva (kVArh)";
        break;
      default:
        xAxisTitle = "";
        yAxisTitle = "";
        yAxisTitleRight = "";
        break;
    }

    return { xAxisTitle, yAxisTitle, yAxisTitleRight };
  };

  const { xAxisTitle, yAxisTitle, yAxisTitleRight } = getAxisTitles(filter);

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>Energía Activa y Reactiva</h4>
        <p>
        Valor promedio del consumo de Energía Activa Entregada (kWh) y Energía Reactiva Entregada (kVArh){" "}
        {filter === "month"
          ? "cada día del mes."
          : filter === "week"
          ? "en cada día de la semana."
          : "en cada hora del día."}{" "}
        El área sombreada representa más o menos una desviación estándar.
      </p>
        <div className="filter-container">
          <label htmlFor="filter-select">Filtro:</label>
          <select
            id="filter-select"
            value={filter}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>
      </div>

      {error ? (
        <p>Error al obtener los datos de energía</p>
      ) : chartData ? (
        <Line
          data={chartData}
          options={{
            scales: {
              x: { title: { display: true, text: xAxisTitle } },
              y: {
                title: { display: true, text: yAxisTitle },
                suggestedMax: 2.5,
              },
              y1: {
                // Configuración del eje derecho (y1)
                position: "right", // Mostrar el eje en el costado derecho
                title: { display: true, text: yAxisTitleRight },
                suggestedMax: 2.5, // Puedes ajustar este valor según tus necesidades
              },
            },
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  boxWidth: 12,
                  padding: 15,
                  font: {
                    size: 13,
                  },
                },
              },
            },
          }}
        />
      ) : (
        <p>Cargando datos...</p>
      )}
    </div>
    
  );
};

export default EnergyChart;
