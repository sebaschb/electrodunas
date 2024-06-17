import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

async function fetchLatestAlertsSummary() {
  const res = await fetch(
    `http://localhost:5000/api/alerts-summary-latest-color-total`
  );
  const data = await res.json();
  return data;
}

const AlertChart = () => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Función para obtener los datos de la ruta y actualizar el estado de la gráfica
    async function fetchDataAndUpdateChart() {
      try {
        const data = await fetchLatestAlertsSummary();
        setChartData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchDataAndUpdateChart();
  }, []);

  useEffect(() => {
    // Configuración de datos y opciones del gráfico
    const data = {
      labels: ["Alta", "Media", "Baja"],
      datasets: [
        {
          data: chartData
            ? [chartData.high, chartData.medium, chartData.low]
            : [0, 0, 0],
          backgroundColor: ["#B90011", "#F17B41", "#FFBF41"],
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      responsive: true,
      aspectRatio: 1,
      legend: {
        position: "right",
      },
    };

    // Si ya se ha obtenido la data de la ruta, crear instancia del gráfico
    if (chartData) {
      const chart = new Chart(chartRef.current, {
        type: "doughnut",
        data: data,
        options: options,
      });

      // Limpia el gráfico al desmontar el componente
      return () => {
        chart.destroy();
      };
    }
  }, [chartData]);

  return (
    <div className="chart-container">
      <canvas ref={chartRef} />
    </div>
  );
};

export default AlertChart;
