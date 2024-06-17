import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { Modal } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import es from "date-fns/locale/es";
import DatePicker from "react-datepicker";
import InfoChart from "@/components/InfoChart";
import "react-datepicker/dist/react-datepicker.css";

const EnergyChart = ({ userId, show, handleClose }) => {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState({ startDate: null, endDate: null });
  const [comparePeriod, setComparePeriod] = useState({
    startDate: null,
    endDate: null,
  });
  const [comparePeriodVisible, setComparePeriodVisible] = useState(false);
  const [typeData, setTypeData] = useState("energy");

  const fetchHistoricalData = async (userId, startDate, endDate, endpoint) => {
    const queryParams = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
    const url = `http://localhost:5000/api/users/${userId}/${endpoint}?${queryParams.toString()}`;
    const res = await fetch(url);
    const data = await res.json();
    return data;
  };

  const generateChartData = async () => {
    try {
      let data = {};

      if (userId && period.startDate && period.endDate) {
        if (typeData === "energy") {
          const fetchedEnergy = await fetchHistoricalData(
            userId,
            period.startDate,
            period.endDate,
            "energy/historical"
          );

          const labels = Object.keys(fetchedEnergy);
          const activeEnergyData = Object.values(fetchedEnergy).map(
            (entry) => entry.activeEnergySum
          );
          const reactiveEnergyData = Object.values(fetchedEnergy).map(
            (entry) => entry.reactiveEnergySum
          );

          data = {
            labels: labels,
            datasets: [
              {
                label: "Energía Activa",
                data: activeEnergyData,
                fill: false,
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
              },
              {
                label: "Energía Reactiva",
                data: reactiveEnergyData,
                fill: false,
                borderColor: "rgb(255, 99, 132)",
                tension: 0.1,
              },
            ],
          };

          if (comparePeriod.startDate && comparePeriod.endDate) {
            const fetchedCompareEnergy = await fetchHistoricalData(
              userId,
              comparePeriod.startDate,
              comparePeriod.endDate,
              "energy/historical"
            );

            const compareActiveEnergyData = Object.values(
              fetchedCompareEnergy
            ).map((entry) => entry.activeEnergySum);
            const compareReactiveEnergyData = Object.values(
              fetchedCompareEnergy
            ).map((entry) => entry.reactiveEnergySum);

            data.datasets.push({
              label: "Energía Activa (Comparación)",
              data: compareActiveEnergyData,
              fill: false,
              borderColor: "rgb(0, 0, 255)",
              tension: 0.1,
            });

            data.datasets.push({
              label: "Energía Reactiva (Comparación)",
              data: compareReactiveEnergyData,
              fill: false,
              borderColor: "rgb(0, 440, 0)",
              tension: 0.1,
            });
          }
        } else if (typeData === "voltage") {
          const fetchedVoltage = await fetchHistoricalData(
            userId,
            period.startDate,
            period.endDate,
            "instrumentations"
          );

          const labels = Object.keys(fetchedVoltage);
          const faVoltageData = Object.values(fetchedVoltage).map(
            (entry) => entry.fa_voltage
          );
          const fbVoltageData = Object.values(fetchedVoltage).map(
            (entry) => entry.fb_voltage
          );
          const fcVoltageData = Object.values(fetchedVoltage).map(
            (entry) => entry.fc_voltage
          );

          data = {
            labels: labels,
            datasets: [
              {
                label: "Voltaje FA",
                data: faVoltageData,
                fill: false,
                borderColor: "rgb(75, 192, 192)",
                tension: 0.1,
              },
              {
                label: "Voltaje FB",
                data: fbVoltageData,
                fill: false,
                borderColor: "rgb(255, 99, 132)",
                tension: 0.1,
              },
              {
                label: "Voltaje FC",
                data: fcVoltageData,
                fill: false,
                borderColor: "rgb(0, 0, 255)",
                tension: 0.1,
              },
            ],
          };

          if (comparePeriod.startDate && comparePeriod.endDate) {
            const fetchedCompareVoltage = await fetchHistoricalData(
              userId,
              comparePeriod.startDate,
              comparePeriod.endDate,
              "instrumentations"
            );

            const compareFAVoltageData = Object.values(
              fetchedCompareVoltage
            ).map((entry) => entry.fa_voltage);
            const compareFBVoltageData = Object.values(
              fetchedCompareVoltage
            ).map((entry) => entry.fb_voltage);
            const compareFCVoltageData = Object.values(
              fetchedCompareVoltage
            ).map((entry) => entry.fc_voltage);

            data.datasets.push({
              label: "Voltaje FA (Comparación)",
              data: compareFAVoltageData,
              fill: false,
              borderColor: "rgb(0, 440, 0)",
              tension: 0.1,
            });

            data.datasets.push({
              label: "Voltaje FB (Comparación)",
              data: compareFBVoltageData,
              fill: false,
              borderColor: "rgb(255, 165, 0)",
              tension: 0.1,
            });

            data.datasets.push({
              label: "Voltaje FC (Comparación)",
              data: compareFCVoltageData,
              fill: false,
              borderColor: "rgb(128, 0, 128)",
              tension: 0.1,
            });
          }
        }
      } else {
        toast.info("Seleccione un rango de fechas");
        return;
      }

      setChartData(data);
      setError(false);
    } catch (error) {
      console.error("Error al obtener los datos de energía:", error);
      toast.error(
        "Hubo un error al obtener los datos de energía. Por favor, inténtelo de nuevo más tarde."
      );
      setChartData(null);
      setError(true);
    }
  };

  const handleDateChange = (date, field) => {
    const value = new Date(date);
    const updatedPeriod = { ...period, [field]: value };
    if (field === "startDate" && value > period.endDate) {
      updatedPeriod.endDate = value;
    } else if (field === "endDate" && value < period.startDate) {
      toast.error("Selecciona un período válido");
    } else if (field === "endDate" && value > new Date()) {
      toast.error("Selecciona una fecha futura");
    }
    setPeriod(updatedPeriod);
  };

  const handleComparePeriodChange = (e) => {
    const comparePeriodVisible = e.target.checked;
    setComparePeriodVisible(comparePeriodVisible);
    if (!comparePeriodVisible) {
      setComparePeriod({ startDate: null, endDate: null });
    }
  };

  const handleCompareDateChange = (date, field) => {
    const value = new Date(date);
    const updatedComparePeriod = { ...comparePeriod, [field]: value };
    if (field === "startDate" && value > comparePeriod.endDate) {
      updatedComparePeriod.endDate = value;
    } else if (field === "endDate" && value < comparePeriod.startDate) {
      toast.error("Selecciona un período de comparación válido");
    } else if (field === "endDate" && value > new Date()) {
      toast.error("Selecciona una fecha futura");
    }
    setComparePeriod(updatedComparePeriod);
  };

  const handleCloseModal = () => {
    setChartData(null);
    handleClose();
  };

  const resetChartData = () => {
    setPeriod({ startDate: null, endDate: null });
    setComparePeriod({ startDate: null, endDate: null });
    setChartData(null);
    setError(false);
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleCloseModal}
        dialogClassName="custom-size-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Información Histórica</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="chart-data col-md-3">
              <div className="border rounded p-3 shadow-sm">
                <div className="container">
                  <p>Selecciona el tipo de gráfico que quieres comparar</p>
                  <div>
                    <select
                      className="form-select"
                      id="typeData"
                      value={typeData}
                      onChange={(e) => {
                        setTypeData(e.target.value);
                        resetChartData();
                      }}
                    >
                      <option value="energy">Energía</option>
                      <option value="voltage">Voltaje</option>
                    </select>
                  </div>
                </div>

                <div className="container">
                  <p>Selecciona las fechas para generar el gráfico.</p>
                  <div className="form-group">
                    <h6>Período</h6>
                    <DatePicker
                      selected={period.startDate}
                      onChange={(date) => handleDateChange(date, "startDate")}
                      selectsStart
                      startDate={period.startDate}
                      endDate={period.endDate}
                      dateFormat="dd/MM/yyyy"
                      locale={es}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      placeholderText="Fecha inicial"
                      maxDate={new Date()}
                    />
                    <DatePicker
                      selected={period.endDate}
                      onChange={(date) => handleDateChange(date, "endDate")}
                      selectsEnd
                      startDate={period.startDate}
                      endDate={period.endDate}
                      dateFormat="dd/MM/yyyy"
                      locale={es}
                      minDate={period.startDate}
                      className="form-control"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      placeholderText="Fecha final"
                      maxDate={new Date()}
                    />
                  </div>

                  <div className="container form-group">
                    <input
                      className=""
                      type="checkbox"
                      id="comparePeriod"
                      checked={comparePeriodVisible}
                      onChange={handleComparePeriodChange}
                    />
                    <label htmlFor="comparePeriod">
                      ¿Quieres comparar con otro período?
                    </label>
                    {comparePeriodVisible && (
                      <div className="container">
                        <h6>Período de Comparación</h6>
                        <DatePicker
                          selected={comparePeriod.startDate}
                          onChange={(date) =>
                            handleCompareDateChange(date, "startDate")
                          }
                          selectsStart
                          startDate={comparePeriod.startDate}
                          endDate={comparePeriod.endDate}
                          dateFormat="dd/MM/yyyy"
                          locale={es}
                          className="form-control"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          placeholderText="Fecha inicial"
                          maxDate={new Date()}
                        />
                        <DatePicker
                          selected={comparePeriod.endDate}
                          onChange={(date) =>
                            handleCompareDateChange(date, "endDate")
                          }
                          selectsEnd
                          startDate={comparePeriod.startDate}
                          endDate={comparePeriod.endDate}
                          dateFormat="dd/MM/yyyy"
                          locale={es}
                          minDate={comparePeriod.startDate}
                          className="form-control"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          placeholderText="Fecha final"
                          maxDate={new Date()}
                        />
                      </div>
                    )}
                  </div>

                  <div className="container">
                    <button
                      className="btn container btn-primary mt-3"
                      onClick={generateChartData}
                    >
                      Generar gráfico
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-energy col-md-9">
              <div className="chart-container border alerts-container rounded p-3 shadow-sm">
                <h4>Información histórica</h4>
                <InfoChart description="Para cada día se suma el consumo reportado de Energía Activa (kWh) y Energía Reactiva (kVArh) entregada cada 15 minutos por el medidor." />
                <p>Consumo total de Energía Activa (kWh) y Energía Reactiva (kVArh) entregada en cada día de acuerdo con el intervalo de tiempo especificado por el usuario.</p>
                {chartData ? (
                  <>
                    <Line
                      data={chartData}
                      options={{
                        scales: {
                          x: { title: { display: true, text: "Tiempo" } },
                          y: {
                            title: {
                              display: true,
                              text: "Energía (kWh)",
                            },
                            suggestedMax: 1,
                          },
                        },
                      }}
                    />
                    <div className="br-info-chart" />
                  </>
                ) : (
                  <>
                    <div className="br-info-history" />
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EnergyChart;
