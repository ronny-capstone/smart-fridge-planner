import LogModal from "./LogModal";
import LogForm from "./LogForm";
import { API_BASE_URL } from "../utils/api";
import { useEffect, useState } from "react";

export default function LogList() {
  const [logs, setLogs] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [logToUpdate, setLogToUpdate] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const LOG_PATH = "/log";
  const FOOD_PATH = "/food";

  useEffect(() => {
    fetch(`${API_BASE_URL}${LOG_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setLogs(data);
      })
      .catch((err) => {
        console.log(err.message);
      });

    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [setLogs]);

  const getFoodNameById = (itemId) => {
    const foodItem = foodItems.find((item) => item.id === itemId);
    return foodItem ? foodItem.name : "Unknown id";
  };

  const handleLogAdded = (createdLog) => {
    setLogs((prevLogs) => [createdLog.log, ...prevLogs]);
    setActiveModal(null);
  };

  const handleLogUpdated = (updatedLog) => {
    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === updatedLog.log.id ? updatedLog.log : log
      )
    );
    setActiveModal(null);
    setLogToUpdate(null);
  };

  const handleDelete = async (logToDelete) => {
    try {
      await fetch(`${API_BASE_URL}${LOG_PATH}/${logToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setLogs(
              logs.filter(function (log) {
                return log !== logToDelete;
              })
            );
          }
        })
        .catch((err) => {
          console.log("Failed to delete log:", err);
        });
    } catch (err) {
      console.log("Failed to delete log:", err.message);
    }
  };

  const openAddModal = () => {
    setActiveModal("add");
    setLogToUpdate(null);
  };

  const openUpdateModal = (log) => {
    setActiveModal(`update-${log.id}`);
    setLogToUpdate(log);
  };

  const closeModal = () => {
    setActiveModal(null);
    setLogToUpdate(null);
  };

  const formatDateString = (dateString) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <button onClick={openAddModal}> Add new log </button>
      {activeModal === "add" && (
        <LogModal onClose={closeModal}>
          {" "}
          <LogForm
            handleLogAdded={handleLogAdded}
            handleLogUpdated={handleLogUpdated}
            setShowModal={closeModal}
            type="add"
            logToUpdate={null}
          />{" "}
        </LogModal>
      )}
      <div className="logList">
        {logs.length == 0 && <p> No logs yet! </p>}
        {/* Sorted by most recently added  */}
        {logs
          .sort((a, b) => b.id - a.id)
          .map((log) => {
            return (
              <div className="logCard" key={log.id}>
                <h3 className="log-title">
                  {" "}
                  Log for {formatDateString(log.date_logged)}{" "}
                </h3>
                <p className="log-item"> Food item: {getFoodNameById(log.item_id)} </p>
                <p className="log-servings"> Servings: {log.servings} </p>
                <button onClick={() => openUpdateModal(log)}> Update </button>
                <button onClick={() => handleDelete(log)}> Delete </button>
                {activeModal === `update-${log.id}` && (
                  <LogModal onClose={closeModal}>
                    {" "}
                    <LogForm
                      handleLogAdded={handleLogAdded}
                      handleLogUpdated={handleLogUpdated}
                      setShowModal={closeModal}
                      type="update"
                      logToUpdate={log}
                    />{" "}
                  </LogModal>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
