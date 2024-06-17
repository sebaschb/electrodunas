import BaseLayout from "@/components/BaseLayout";
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from "react-bootstrap/Pagination";
import AlertDetail from "../components/alertDetail";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import es from "date-fns/locale/es";

async function fetchAlertsSummary(numDays, pageSize, page, endDate, orderBy) {
  try {
    const formattedEndDate = endDate.toLocaleDateString("en-GB");
    const res = await fetch(
      `http://localhost:5000/api/alerts-summary?numDays=${numDays}&pageSize=${pageSize}&page=${page}&endDate=${formattedEndDate}&orderBy=${orderBy}`
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching alerts summary:", error);
    throw error;
  }
}

const Alerts = () => {
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [selectedNumDays, setSelectedNumDays] = useState(30);
  const [selectedEndDate, setSelectedEndDate] = useState(
    new Date("2023-02-28")
  );
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPageEmpty, setNextPageEmpty] = useState(false);
  const [orderBy, setOrderBy] = useState("high");

  useEffect(() => {
    async function getAlertsSummary() {
      try {
        const data = await fetchAlertsSummary(
          selectedNumDays,
          pageSize,
          currentPage,
          selectedEndDate,
          orderBy
        );
        setAlertsSummary(data);

        const nextPageAlerts = await fetchAlertsSummary(
          selectedNumDays,
          pageSize,
          currentPage + 1,
          selectedEndDate,
          orderBy
        );

        setNextPageEmpty(Object.keys(nextPageAlerts).length === 0);
      } catch (error) {
        console.error("Error getting alerts summary:", error);
      }
    }
    getAlertsSummary();
  }, [selectedNumDays, pageSize, currentPage, selectedEndDate, orderBy]);

  function getOpacity(value) {
    const maxAlarmValue = Math.max(
      ...Object.values(alertsSummary).map((summary) => summary.high || 0),
      ...Object.values(alertsSummary).map((summary) => summary.medium || 0),
      ...Object.values(alertsSummary).map((summary) => summary.low || 0)
    );

    const minOpacity = 0.1;
    const maxOpacity = 1;
    const minAlarmValue = 0;

    const normalizedValue =
      (value - minAlarmValue) / (maxAlarmValue - minAlarmValue);
    return minOpacity + normalizedValue * (maxOpacity - minOpacity);
  }

  function handlePageChange(pageNumber) {
    setCurrentPage(pageNumber);
  }

  // Agrega el estado para el modal de detalle de alerta
  const [showModal, setShowModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Agrega la función para manejar el clic en una fila de alerta y abrir el modal de detalle
  const handleAlertClick = (alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  return (
    <BaseLayout>
      <div className="row">
        <div className="col-md-12">
          <div className="container-fluid border rounded shadow-sm">
            <div className="table-fixed">
              <h4 className="alerts-title fw-bold mb-4">Resumen de Alertas</h4>

              <div className="d-flex justify-content-end mb-4">
                <label htmlFor="orderBySelect" className="my-auto mx-2">
                  Ordenar por:
                </label>
                <select
                  id="orderBySelect"
                  name="orderBy"
                  className="form-select select-order-alarms"
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                >
                  <option value="high">Rojo</option>
                  <option value="medium">Naranja</option>
                  <option value="low">Amarillo</option>
                </select>
                <label htmlFor="endDateInput" className="my-auto mx-2">
                  Fecha de referencia:
                </label>
                <DatePicker
                  selected={selectedEndDate}
                  onChange={setSelectedEndDate}
                  locale={es}
                  dateFormat="dd/MM/yyyy"
                  className="form-control select-endDate-alarms"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                />
                <label htmlFor="numDaysSelect" className="my-auto mx-2">
                  Mostrar:
                </label>
                <select
                  id="numDaysSelect"
                  name="numDays"
                  className="form-select select-days-alarms"
                  value={selectedNumDays}
                  onChange={(e) => setSelectedNumDays(parseInt(e.target.value))}
                >
                  <option value={30}>Últimos 30 días</option>
                  <option value={7}>Últimos 7 días</option>
                  <option value={1}>Último día</option>
                </select>
              </div>

              <table className="table table-hover table-responsive">
                <thead>
                  <tr>
                    <th>NIS</th>
                    <th>Nombre</th>
                    <th>Alertas rojas</th>
                    <th>Alertas naranjas</th>
                    <th>Alertas amarillas</th>
                  </tr>
                </thead>
                <tbody>
                  {alertsSummary &&
                    alertsSummary.map((summary) => (
                      <tr
                        key={summary.nis_id}
                        onClick={() => handleAlertClick(summary.nis_id)}
                      >
                        <td>{summary.nis_id}</td>
                        <td>{summary.name}</td>
                        <td
                          style={{
                            backgroundColor: `rgba(185, 0, 17, ${getOpacity(
                              summary.high || 0
                            )})`,
                          }}
                        >
                          {summary.high || 0}
                        </td>
                        <td
                          style={{
                            backgroundColor: `rgba(241, 123, 65, ${getOpacity(
                              summary.medium || 0
                            )})`,
                          }}
                        >
                          {summary.medium || 0}
                        </td>
                        <td
                          style={{
                            backgroundColor: `rgba(255, 191, 65, ${getOpacity(
                              summary.low || 0
                            )})`,
                          }}
                        >
                          {summary.low || 0}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="d-flex mt-4">
                <Pagination>
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Item active>{currentPage}</Pagination.Item>
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={nextPageEmpty}
                  />
                </Pagination>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AlertDetail
        show={showModal}
        handleClose={() => setShowModal(false)}
        alert={selectedAlert}
        selectedEndDate={selectedEndDate}
      />
      <ToastContainer />
    </BaseLayout>
  );
};

export default Alerts;
