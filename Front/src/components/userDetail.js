import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import EnergyChart from "../components/EnergyChart";
import HistoricalInfoModal from "../components/HistoricalInfoModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

async function fetchUser(userId) {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${userId}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

const UserDetail = ({ show, handleClose, user }) => {
  const [userData, setUserData] = useState(null);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);

  useEffect(() => {
    async function getUserData(userId) {
      try {
        const fetchedUser = await fetchUser(userId);
        setUserData(fetchedUser);
      } catch (error) {
        toast.error("Error al cargar los datos del usuario");
      }
    }

    if (user) {
      getUserData(user.id);
    }
  }, [user]);

  const handleShowHistoricalModal = () => {
    setShowHistoricalModal(true);
  };

  const handleCloseHistoricalModal = () => {
    setShowHistoricalModal(false);
  };

  const handleCloseModal = () => {
    setUserData(null);
    handleClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleCloseModal}
      dialogClassName="custom-size-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Información del usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {userData && (
          <div className="row">
            <div className="chart-data col-md-9">
              <div className="chart-container border rounded p-3 shadow-sm">
                <EnergyChart userId={userData.id} />
              </div>
            </div>
            <div className="chart-energy col-md-3">
              <div className="border rounded p-3 shadow-sm">
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
              <button
                variant="primary"
                onClick={() => handleShowHistoricalModal()}
                className="btn container btn-primary mt-3"
              >
                Información histórica
              </button>
            </div>
          </div>
        )}
      </Modal.Body>
      {userData && (
        <HistoricalInfoModal
          userId={userData.id}
          show={showHistoricalModal}
          handleClose={handleCloseHistoricalModal}
        />
      )}
    </Modal>
  );
};

export default UserDetail;
