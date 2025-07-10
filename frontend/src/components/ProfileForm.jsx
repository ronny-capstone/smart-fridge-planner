import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH, AUTH_PATH } from "../utils/paths";
import { checkInvalidVariable } from "../utils/invalidVars";

export default function ProfileForm({ profileSubmit }) {
  // Determines if user is updating an existing profile or creating new one
  const [isUpdating, setIsUpdating] = useState(false);
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightKg, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [healthGoal, setHealthGoal] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
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
          throw new Error("Authentication error");
        }
      })
      .then((data) => {
        if (data.authenticated && data.user_id) {
          setCurrentUser(data.user_id);
        } else {
          console.log("User not logged in:", data.message);
        }
      })
      .catch((err) => {
        console.log("Failed to get current user:", err);
      });
  };

  // When currentUser is set, determine if user is logging in / signing up
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    // Get current user's profile, if exists
    fetch(`${API_BASE_URL}${PROFILE_PATH}/${currentUser}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then((data) => {
        // User is updating their profile
        setIsUpdating(true);
        // Sets state to a string if value is undefined
        setHeightFeet(data.profile.height_feet ?? "");
        setHeightInches(data.profile.height_inches ?? "");
        setWeight(data.profile.weight_kg ?? "");
        setAge(data.profile.age ?? "");
        setGender(data.profile.gender ?? "");
        setActivityLevel(data.profile.activity ?? "");
        setHealthGoal(data.profile.health_goal ?? "");
        setDietaryPreferences(data.profile.dietary_preferences ?? "");
      })
      .catch((err) => {
        // User is creating their profile
        setIsUpdating(false);
        setHeightFeet("");
        setHeightInches("");
        setWeight("");
        setAge("");
        setGender("");
        setActivityLevel("");
        setHealthGoal("");
        setDietaryPreferences("");
      });
    // Run this whenever currentUser changes
  }, [currentUser]);

  const handleSubmit = (e) => {
    // Stops page from refreshing
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in");
      return;
    }
    if (
      checkInvalidVariable(heightFeet) ||
      checkInvalidVariable(heightInches) ||
      checkInvalidVariable(weightKg) ||
      checkInvalidVariable(age) ||
      checkInvalidVariable(gender) ||
      checkInvalidVariable(activityLevel) ||
      checkInvalidVariable(healthGoal) ||
      checkInvalidVariable(dietaryPreferences)
    ) {
      alert("Please fill out all fields");
      return;
    }

    const endpoint = isUpdating
      ? `${API_BASE_URL}${PROFILE_PATH}/${currentUser}`
      : `${API_BASE_URL}${PROFILE_PATH}`;
    const method = isUpdating ? "PATCH" : "POST";

    try {
      // Make API request to create or update profile
      fetch(endpoint, {
        method: method,
        body: JSON.stringify({
          id: currentUser,
          health_goal: healthGoal,
          dietary_preferences: dietaryPreferences,
          age: parseInt(age),
          weight_kg: parseInt(weightKg),
          height_feet: parseInt(heightFeet),
          height_inches: parseInt(heightInches),
          gender: gender,
          activity: activityLevel,
        }),
        headers: { "Content-type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset form
          setHeightFeet("");
          setHeightInches("");
          setWeight("");
          setAge("");
          setGender("");
          setActivityLevel("");
          setHealthGoal("");
          setDietaryPreferences("");
          alert(`Profile ${isUpdating ? "updated" : "created"} successfully`);

          if (profileSubmit) {
            profileSubmit();
          }
        })
        .catch((err) => {
          alert(`Failed to ${isUpdating ? "update" : "create"} profile`);
        });
    } catch (err) {
      alert(`Failed to ${isUpdating ? "update" : "create"} profile`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        {isUpdating ? <h1> Update Profile</h1> : <h1> Create Profile</h1>}

        <div>
          <p> Height</p>
          <input
            type="text"
            value={heightFeet}
            placeholder={"Feet"}
            onChange={(e) => setHeightFeet(e.target.value)}
          />
          <input
            type="text"
            value={heightInches}
            placeholder={"Inches"}
            onChange={(e) => setHeightInches(e.target.value)}
          />
        </div>

        <div>
          <p>Weight</p>
          <input
            type="text"
            value={weightKg}
            placeholder={"Weight in kilograms"}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>

        <div>
          <p>Age</p>
          <input
            type="text"
            value={age}
            placeholder={"Age"}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        <div>
          <p>Gender</p>
          <select
            name="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value=""> Select gender </option>

            <option value={"Male"}>Male</option>
            <option value={"Female"}>Female</option>
          </select>
        </div>

        <div>
          <p>Activity Level</p>
          <select
            name="activityLevel"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
          >
            <option value=""> Select activity Level </option>

            <option value={"Sedentary"}>Sedentary (no exercise)</option>
            <option value={"Lightly active"}>
              Lightly active (1-2 days/week){" "}
            </option>
            <option value={"Moderately active"}>
              Moderately active (3-5 days/week)
            </option>
            <option value={"Active"}>Very active (6-7 days/week)</option>
            <option value={"Very active"}>Athlete (2x day) </option>
          </select>
        </div>

        <div>
          <p>Dietary Preferences</p>
          <select
            name="dietaryPreference"
            value={dietaryPreferences}
            onChange={(e) => setDietaryPreferences(e.target.value)}
          >
            <option value=""> Select dietary preference </option>
            <option value={"None"}>None</option>
            <option value={"Vegetarian"}>Vegetarian</option>
            <option value={"Vegan"}>Vegan</option>
            <option value={"Gluten-free"}>Gluten-free</option>
            <option value={"Dairy-free"}>Dairy-free</option>
            <option value={"Pescatarian"}>Pescatarian</option>
          </select>
        </div>

        <div>
          <p>Health Goal</p>

          <select
            name="healthGoal"
            value={healthGoal}
            onChange={(e) => setHealthGoal(e.target.value)}
          >
            <option value=""> Select health goal </option>
            <option value={"Lose Weight"}>Lose weight</option>
            <option value={"Gain Weight"}>Gain weight</option>
            <option value={"Maintain Weight"}>Maintain weight</option>
          </select>
        </div>

        <div className="mb-1 w-full max-w-sm">
          <button type="submit" onClick={handleSubmit}>
            {isUpdating ? "Update Profile" : "Create Profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
