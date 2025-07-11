import { useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/api";
import { AUTH_PATH, SIGNUP_PATH, LOGIN_PATH } from "../utils/paths";

export default function UserAuth({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user it already logged in when renders
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    fetch(`${API_BASE_URL}${AUTH_PATH}/me`, {
      // Includes session cookies in the request
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        // User is already logged in
        if (response.ok) {
          return response.json();
        }
      })
      .then((data) => {
        if (data.authenticated) {
          // Not a new user
          onAuth(false);
        }
        // If user not authenticated, stay on login form
      })
      .catch((err) => {
        console.log("Not logged in:", err);
      });
  };

  const handleSubmit = (e) => {
    // Stops browser from refreshing
    e.preventDefault();
    if (username === "" || password === "") {
      alert("Please fill out all fields: username and password");
      return;
    }
    if (isSignUp && password.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    const endpoint = isSignUp
      ? `${AUTH_PATH}${SIGNUP_PATH}`
      : `${AUTH_PATH}${LOGIN_PATH}`;

    // Call signup or login endpoint with username and password
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: username, password: password }),
    })
      .then((response) => {
        if (response.ok) {
          if (isSignUp) {
            // Signup successful, switch to login
            setIsSignUp(false);
            setPassword("");
            alert("Signup successful");
          } else {
            // Login successful, need to create profile
            // Check if user has profile
            fetch(`${API_BASE_URL}/auth/me`, {
              method: "GET",
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.authenticated && data.user_id) {
                  fetch(`${API_BASE_URL}/profile/${data.user_id}`, {
                    credentials: "include",
                  })
                    .then((res) => {
                      if (res.status === 404) {
                        // User needs to create profile
                        onAuth(true);
                      } else {
                        // Profile exists
                        onAuth(false);
                      }
                    })
                    .catch(() => {
                      onAuth(true);
                    });
                }
              });
          }
        } else {
          if (response.status === 401) {
            if (isSignUp) {
              alert("Error creating account. Please try again");
            } else {
              alert("Invalid username or password");
            }
          }
        }
      })
      .catch((err) => {
        alert(`${isSignUp ? "Sign up" : "Login"} error`);
      });
  };

  // Toggle whether user is signing up or logging in
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setPassword("");
  };

  return (
    <div>
      <h1>Smart Food Tracker</h1>
      <h3>Track your food, manage your kitchen</h3>

      <p>{isSignUp ? "Sign up" : "Log in"}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <p>Username</p>
          <input
            type="text"
            value={username}
            placeholder={"Enter your username"}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <p>Password</p>
          <input
            type="password"
            value={password}
            placeholder={"Enter your password"}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-1 w-full max-w-sm">
          <button type="submit" onClick={handleSubmit}>
            {isSignUp ? "Create account" : "Sign in"}
          </button>
        </div>
      </form>
      <div>
        <p>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button onClick={toggleMode}>
            {isSignUp ? "Sign in" : "Sign up"}{" "}
          </button>
        </p>
      </div>
    </div>
  );
}
