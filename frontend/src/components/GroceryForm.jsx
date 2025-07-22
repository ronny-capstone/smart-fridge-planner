import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { GROCERY_PATH, FOOD_PATH } from "../utils/paths";
import { toast } from "react-toastify";

export default function GroceryForm({
  handleGroceryAdded,
  handleGroceryUpdated,
  setShowModal,
  type,
  groceryToUpdate,
  currentUser,
}) {
  const [foodItem, setFoodItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [foodItems, setFoodItems] = useState([]);

  // Fetch food items for dropdown options
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

  // Prepopulate form fields for updates
  useEffect(() => {
    if (type === "update" && groceryToUpdate) {
      setFoodItem(groceryToUpdate.item_id.toString());
      setQuantity(groceryToUpdate.quantity.toString());
    }
  }, [type, groceryToUpdate]);

  const addGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );
    if (!selectedFood) {
      toast.error("Please select a valid food item");
      return;
    }
    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}`, {
        method: "POST",
        body: JSON.stringify({
          user_id: currentUser,
          item_id: parseInt(foodItem),
          name: selectedFood.name,
          quantity: parseInt(quantity),
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleGroceryAdded(data);
          // Reset form
          setFoodItem("");
          setQuantity("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to add grocery item:", err.message);
        });
    } catch (err) {
      console.log("Failed to add grocery item:", err.message);
    }
  };

  const updateGrocery = () => {
    // Find selected food item by ID
    const selectedFood = foodItems.find(
      (item) => item.id === parseInt(foodItem)
    );

    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}/${groceryToUpdate.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: parseInt(quantity),
          item_id: parseInt(foodItem),
          name: selectedFood.name,
        }),
        headers: {
          "Content-type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          handleGroceryUpdated(data);
          // Reset form
          setFoodItem("");
          setQuantity("");
          setShowModal(false);
        })
        .catch((err) => {
          console.log("Failed to update grocery item:", err);
        });
    } catch (err) {
      console.log("Failed to update grocery item:", err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem === "" || quantity === "") {
      toast.error("Please fill out all fields.");
      return;
    }
    if (
      !Number.isInteger(parseInt(foodItem)) ||
      !Number.isInteger(parseInt(quantity)) ||
      parseInt(quantity) <= 0
    ) {
      toast.error("Please select a food item and enter a positive quantity.");
      return;
    }
    if (type === "add") {
      addGrocery();
    } else if (type === "update") {
      updateGrocery();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {type === "add" && <h1>Add to Grocery List</h1>}
        {type === "update" && <h1>Update Grocery Item</h1>}

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
          <label>Quantity:</label>
          <input
            name="quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 1, 2, 5"
          />
        </div>

        <div>
          <button type="submit">
            {type === "add" ? "Add to grocery list" : "Update item"}
          </button>
        </div>
      </div>
    </form>
  );
}
