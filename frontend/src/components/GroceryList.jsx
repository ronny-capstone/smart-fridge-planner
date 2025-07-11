import GroceryForm from "./GroceryForm";
import GroceryCard from "./GroceryCard";
import LogModal from "./LogModal";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { AUTH_PATH, GROCERY_PATH } from "../utils/paths";

export default function GroceryList({ currentUser }) {
  const [groceries, setGroceries] = useState([]);
  const [activeModal, setActiveModal] = useState(false);
  const [groceryToUpdate, setGroceryToUpdate] = useState(null);

  const fetchGroceries = (userId) => {
    fetch(`${API_BASE_URL}${GROCERY_PATH}?user_id=${userId}`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setGroceries(data);
        } else {
          console.log("Expected array but got ", typeof data);
          setGroceries([]);
        }
      })
      .catch((err) => {
        alert("Failed to fetch grocery items: ", err);
        setGroceries([]);
      });
  };

  const handleGroceryAdded = (createdGrocery) => {
    setGroceries((prevGroceries) => [createdGrocery.item, ...prevGroceries]);

    setActiveModal(null);
  };

  const handleGroceryUpdated = (updatedGrocery) => {
    setGroceries((prevGroceries) =>
      prevGroceries.map((grocery) => {
        if (grocery.id === updatedGrocery.item.id) {
          return {
            ...grocery,
            item_id: updatedGrocery.item.id,
            food_name: updatedGrocery.item.name,
            quantity: updatedGrocery.item.quantity,
          };
        }
        return grocery;
      })
    );
    // Refetch
    fetchGroceries(currentUser);
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  const handleDelete = (groceryToDelete) => {
    try {
      fetch(`${API_BASE_URL}${GROCERY_PATH}/${groceryToDelete.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 200) {
            setGroceries(
              groceries.filter((grocery) => grocery.id !== groceryToDelete.id)
            );
          } else {
            alert(`Error deleting item: ${response.json().error}`);
          }
        })
        .catch((err) => {
          console.log("Failed to delete grocery item:", err);
          alert("Error deleting grocery item. Please try again");
        });
    } catch (err) {
      alert("Failed to delete grocery item:", err.message);
    }
  };

  const openAddModal = () => {
    setActiveModal("add");
    setGroceryToUpdate(null);
  };

  const openUpdateModal = (grocery) => {
    setActiveModal("update");
    setGroceryToUpdate(grocery);
  };

  const closeModal = () => {
    setActiveModal(null);
    setGroceryToUpdate(null);
  };

  return (
    <div>
      <h1> Grocery List </h1>
      <button onClick={openAddModal}>Add Grocery Item</button>

      {/* Add Modal */}
      {activeModal === "add" && (
        <LogModal onClose={closeModal}>
          <GroceryForm
            handleGroceryAdded={handleGroceryAdded}
            handleGroceryUpdated={handleGroceryUpdated}
            setShowModal={closeModal}
            type="add"
            groceryToUpdate={null}
            currentUser={currentUser}
          />
        </LogModal>
      )}

      {/* Main grocery list section */}
      <div className="groceryList">
        <h2>Your Grocery Items ({groceries.length})</h2>
        {groceries.length == 0 && <p>Your grocery list is empty!</p>}

        {groceries.map((grocery) => {
          return (
            <GroceryCard
              key={grocery.id}
              grocery={grocery}
              handleEdit={openUpdateModal}
              handleDelete={handleDelete}
            />
          );
        })}

        {/* Update Modal */}
        {groceryToUpdate && activeModal === "update" && (
          <LogModal onClose={closeModal}>
            <GroceryForm
              handleGroceryAdded={handleGroceryAdded}
              handleGroceryUpdated={handleGroceryUpdated}
              setShowModal={closeModal}
              type="update"
              groceryToUpdate={groceryToUpdate}
              currentUser={currentUser}
            />
          </LogModal>
        )}
      </div>
    </div>
  );
}
