import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { FOOD_PATH } from "../utils/paths";
import { toast } from "react-toastify";

export default function LogForm({
  handleLogAdded,
  handleLogUpdated,
  setShowModal,
  type,
  logToUpdate,
  currentUser,
}) {
  const [dateLogged, setDateLogged] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [foodItem, setFoodItem] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [servings, setServings] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        toast.error("Unable to load food items˝");
        setFoodItems([]);
      });
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}${FOOD_PATH}`)
      .then((response) => response.json())
      .then((data) => {
        setFoodItems(data);
      })
      .catch((err) => {
        toast.error("Unable to load food items˝");
        setFoodItems([]);
      });
  }, []);

  useEffect(() => {
    if (type === "update" && logToUpdate) {
      setDateLogged(logToUpdate.date_logged);
      setFoodItem(logToUpdate.item_id.toString());
      setServings(logToUpdate.servings.toString());
    }
  }, [type, logToUpdate]);

  const addLog = async () => {
    try {
      await fetch(`${API_BASE_URL}/log`, {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser,
          date_logged: dateLogged,
          item_id: parseInt(foodItem),
          servings: parseInt(servings),
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleLogAdded(data);
          setDateLogged(new Date().toISOString().split("T")[0]);
          setFoodItem("");
          setServings("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to create log:", err);
        });
    } catch (err) {
      console.log("Failed to create log:", err.message);
    }
  };

  const updateLog = async () => {
    try {
      await fetch(`${API_BASE_URL}/log/${logToUpdate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          user_id: currentUser,
          date_logged: dateLogged,
          item_id: parseInt(foodItem),
          servings: parseInt(servings),
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleLogUpdated(data);
          setDateLogged(new Date().toISOString().split("T")[0]);
          setFoodItem("");
          setServings("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to update log:", err);
        });
    } catch (err) {
      console.log("Failed to update log:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem === "" || servings === "") {
      toast.error("Please fill out all fields.");
      return;
    }
    if (
      !Number.isInteger(parseInt(foodItem)) ||
      !Number.isInteger(parseInt(servings)) ||
      parseInt(servings) <= 0
    ) {
      toast.error("Please enter a positive number for food item & servings.");
      return;
    }
    if (type === "add") {
      addLog();
    } else if (type === "update") {
      updateLog();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {type === "add" && <h1>Add New Log</h1>}
        {type === "update" && <h1>Update Log</h1>}

        <div>
          <label>Date logged (defaulted to today):</label>
          <input
            name="dateLogged"
            type="date"
            value={dateLogged}
            onChange={(e) => setDateLogged(e.target.value)}
          />
        </div>
        <div>
          <label>Food item:</label>
          <select
            name="foodItem"
            value={foodItem}
            onChange={(e) => setFoodItem(e.target.value)}
          >
            <option value=""> Select a food item </option>
            {foodItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Servings:</label>
          <input
            name="servings"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
          />
        </div>
        <div>
          <button type="submit">Submit</button>
        </div>
      </div>
    </form>
  );
}
