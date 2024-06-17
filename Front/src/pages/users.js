import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BaseLayout from "@/components/BaseLayout";
import Pagination from "react-bootstrap/Pagination";
import UserDetail from "../components/userDetail";

async function fetchUsers(pageNumber, searchQuery, searchType) {
  try {
    if (
      (searchType === "id" || searchType === "meter_serial_number") &&
      !Number.isInteger(Number(searchQuery))
    ) {
      toast.info(
        "El valor del NIS o número de medidor debe ser un número entero."
      );
      return [];
    }

    const queryParams = new URLSearchParams();
    queryParams.append("pageSize", "15");
    queryParams.append("page", pageNumber.toString());
    queryParams.append(searchType, searchQuery);

    const res = await fetch(`http://localhost:5000/api/users?${queryParams}`);
    const data = await res.json();

    if (res.status !== 200) {
      throw new Error("Error en la respuesta de la API");
    }

    return data;
  } catch (error) {
    toast.error("Error de la base de datos");
    throw error;
  }
}

const Users = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("id");
  const [loading, setLoading] = useState(false);
  const [nextPageEmpty, setNextPageEmpty] = useState(false);

  useEffect(() => {
    async function getUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await fetchUsers(
          currentPage,
          searchQuery,
          searchType
        );
        setUsers(fetchedUsers);
        setLoading(false);

        const nextPageUsers = await fetchUsers(
          currentPage + 1,
          searchQuery,
          searchType
        );
        setNextPageEmpty(nextPageUsers.length === 0);
      } catch (error) {
        setLoading(false);
        toast.error("Error al procesar los usuarios");
        console.error("Error al procesar los usuarios:", error);
      }
    }

    getUsers();
  }, [currentPage, searchQuery, searchType]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchTypeChange = (event) => {
    setSearchType(event.target.value);
    setSearchQuery("");
  };

  const handleClearFilter = () => {
    setSearchQuery("");
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <BaseLayout>
      <div className="container-fluid border rounded shadow-sm">
        <div className="table-fixed">
          <h4 className="alerts-title fw-bold mb-4">Lista de usuarios</h4>
          <div className="d-flex justify-content-end mb-4">
            <label className="my-auto mx-2" htmlFor="form-select">
              Selecciona un filtro:
            </label>
            <select
              className="form-select select-filter-user"
              value={searchType}
              onChange={handleSearchTypeChange}
            >
              <option value="id">Nis</option>
              <option value="names">Nombre</option>
              <option value="district">Zona</option>
              <option value="business_activity">Tipo</option>
              <option value="meter_serial_number">Numero de medidor</option>
            </select>
            <input
              type="text"
              className="form-control input-search-user"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="btn btn-primary" onClick={handleClearFilter}>
              Limpiar
            </button>
          </div>

          {loading ? (
            <div className="text-center">Cargando...</div>
          ) : (
            <table className="table table-hover table-responsive">
              <thead>
                <tr>
                  <th>NIS</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Zona</th>
                  <th>Número de Medidor</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} onClick={() => handleUserClick(user)}>
                    <td>{user.id}</td>
                    <td>{user.names}</td>
                    <td>{user.business_activity}</td>
                    <td>{user.district}</td>
                    <td>{user.meter_serial_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

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

      {showModal && (
        <UserDetail
          show={showModal}
          handleClose={() => setShowModal(false)}
          user={selectedUser}
        />
      )}
      <ToastContainer />
    </BaseLayout>
  );
};

export default Users;
