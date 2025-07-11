import { useState, useEffect } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";
import UserAuth from "./components/UserAuth";
import Inventory from "./components/Inventory";
import ProfileForm from "./components/ProfileForm";
import NutritionDisplay from "./components/NutritionDisplay";
import { API_BASE_URL } from "./utils/api";
import { AUTH_PATH } from "./utils/paths";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  // User id for logged in user
  const [currentUser, setCurrentUser] = useState(null);

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
        }
      })
      .catch((err) => {
        console.log("Failed to get current user:", err);
        setCurrentUser(null);
        setIsAuthenticated(false);
      });
  };

  const handleLogout = () => {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setIsAuthenticated(false);
        setShowProfileForm(false);
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
                {showProfileForm ? "Dismiss Profile" : "Manage Profile"}
              </button>
              <button onClick={() => setShowGoals(!showGoals)}>
                {showGoals
                  ? "Hide Nutrition Targets"
                  : "View Nutrition Targets"}
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
                <LogList currentUser={currentUser} />
                <FoodItemList />
                <GroceryList currentUser={currentUser} />
                <Inventory currentUser={currentUser} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
