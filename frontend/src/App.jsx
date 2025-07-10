import { useState } from "react";
import "./App.css";
import LogList from "./components/LogList";
import FoodItemList from "./components/FoodItemList";
import GroceryList from "./components/GroceryList";
import UserAuth from "./components/UserAuth";
import Inventory from "./components/Inventory";
import ProfileForm from "./components/ProfileForm";
import { API_BASE_URL } from "./utils/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

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
              <button onClick={handleLogout}> Log out</button>
            </div>
            {showProfileForm && (
              <ProfileForm profileSubmit={() => setShowProfileForm(false)} />
            )}
            {!showProfileForm && (
              <div>
                <LogList />
                <FoodItemList />
                <GroceryList />
                <Inventory />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default App;
