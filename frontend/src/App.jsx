import { useState, useEffect } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";
import UserAuth from "./components/UserAuth";
import Inventory from "./components/Inventory";
import ProfileForm from "./components/ProfileForm";
import NutritionDisplay from "./components/NutritionDisplay";
import MealRecForm from "./components/MealRecForm";
import GroceryRecForm from "./components/GroceryRecForm";
import { API_BASE_URL } from "./utils/api";
import { AUTH_PATH, INVENTORY_PATH, REMINDERS_PATH } from "./utils/paths";
import { ToastContainer } from "react-toastify";
import { checkExpiringItems, checkLowStock } from "./utils/inventoryReminders";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  // User id for logged in user
  const [currentUser, setCurrentUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [hasShownReminders, setHasShownReminders] = useState(false);

  // When loads, fetch current user's authentication status
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = () => {
    fetch(`${API_BASE_URL}${AUTH_PATH}/me`, {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return {
            authenticated: false,
            message: "Authenticated check failed",
          };
        }
      })
      .then((data) => {
        if (data.authenticated && data.user_id) {
          setCurrentUser(data.user_id);
          setIsAuthenticated(true);
        } else {
          console.log("User not logged in:", data.message);
          setCurrentUser(null);
          setIsAuthenticated(false);
          setInventory([]);
        }
      })
      .catch((err) => {
        console.log("Failed to get current user:", err);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setInventory([]);
      });
  };

  // Load inventory
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchInventory(currentUser);
    }
  }, [currentUser, isAuthenticated]);

  const fetchInventory = (userId) => {
    fetch(`${API_BASE_URL}${INVENTORY_PATH}?user_id=${userId}`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data) {
          setInventory(data);
        } else {
          console.log("Failed to fetch inventory");
          setInventory([]);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch inventory");
        setInventory([]);
      });
  };

  // Get reminders based on inventory
  useEffect(() => {
    if (
      isAuthenticated &&
      inventory &&
      inventory.length > 0 &&
      !hasShownReminders
    ) {
      checkExpiringItems(inventory, currentUser);
      checkLowStock(inventory, currentUser);
      setHasShownReminders(true);
    }
  }, [isAuthenticated, inventory, hasShownReminders]);

  // Bring back reminders the user chose to hide
  const resetHiddenReminders = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${REMINDERS_PATH}?user_id=${currentUser}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (err) {
      console.log("Failed to reset reminders");
      return false;
    }
  };

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setIsAuthenticated(false);
        setShowProfileForm(false);
        setInventory([]);
        setHasShownReminders(false);
      })
      .catch((err) => {
        console.log("Error logging out");
      });
  };

  const handleAuth = (isNewUser = false) => {
    setIsAuthenticated(true);
    if (isNewUser) {
      setShowProfileForm(true);
    }
    fetchCurrentUser();
  };

  return (
    <>
      <div>
        {/* If user is authenticated show main app, else login form */}
        {!isAuthenticated ? (
          <UserAuth onAuth={handleAuth} />
        ) : (
          <>
            <div>
              <button onClick={() => setShowProfileForm(!showProfileForm)}>
                {showProfileForm ? "Dismiss Profile" : "👤 Manage Profile"}
              </button>
              <button onClick={() => setShowGoals(!showGoals)}>
                {showGoals
                  ? "Hide Nutrition Targets"
                  : "🎯 View Nutrition Targets"}
              </button>
              <button
                onClick={async () => {
                  const success = await resetHiddenReminders(currentUser);
                  if (success) {
                    checkExpiringItems(inventory, currentUser);
                    checkLowStock(inventory, currentUser);
                  }
                }}
              >
                🔔 Reset Hidden Reminders
              </button>
              <button onClick={handleLogout}> Log out</button>
            </div>

            {showProfileForm && (
              <ProfileForm
                currentUser={currentUser}
                profileSubmit={() => setShowProfileForm(false)}
              />
            )}

            {showGoals && (
              <NutritionDisplay
                currentUser={currentUser}
                onClose={() => setShowGoals(false)}
              />
            )}
            {!showProfileForm && !showGoals && (
              <div>
                <div>
                  <ToastContainer
                    position="top-center"
                    autoClose={2000}
                    limit={2}
                    toastStyle={{
                      "--toastify-color-progress-light": "#808080",
                    }}
                  />
                </div>
                <LogList currentUser={currentUser} />
                <FoodItemList />
                <GroceryList currentUser={currentUser} />
                <Inventory
                  currentUser={currentUser}
                  inventory={inventory}
                  setInventory={setInventory}
                  handleInventoryUpdate={fetchInventory}
                />
                <MealRecForm currentUser={currentUser} />
                <GroceryRecForm
                  currentUser={currentUser}
                  inventory={inventory}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
