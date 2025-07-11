import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH, RECIPES_PATH } from "../utils/paths";

export default function MealRecForm({ currentUser }) {
  const [recipeName, setRecipeName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [diet, setDiet] = useState("");
  const [intolerances, setIntolerances] = useState("");
  const [type, setType] = useState("");
  const [ingredientsIncluded, setIngredientsIncluded] = useState("");
  const [minCarbs, setMinCarbs] = useState(0);
  const [maxCarbs, setMaxCarbs] = useState(0);
  const [minProtein, setMinProtein] = useState(0);
  const [maxProtein, setMaxProtein] = useState(0);
  const [minCalories, setMinCalories] = useState(0);
  const [maxCalories, setMaxCalories] = useState(0);
  const [minFats, setMinFats] = useState(0);
  const [maxFats, setMaxFats] = useState(0);
  const cuisinesList = [
    "African",
    "Asian",
    "American",
    "Cajun",
    "Caribbean",
    "Chinese",
    "Eastern European",
    "European",
    "French",
    "German",
    "Greek",
    "Indian",
    "Irish",
    "Italian",
    "Japanese",
    "Jewish",
    "Korean",
    "Latin American",
    "Mediterranean",
    "Mexican",
    "Middle Eastern",
    "Nordic",
    "Southern",
    "Spanish",
    "Thai",
    "Vietnamese",
  ];
  const dietsList = [
    "Gluten Free",
    "Ketogenic",
    "Vegetarian",
    "Vegan",
    "Pescetarian",
    "Paleo",
  ];

  const intolerancesList = [
    "Dairy",
    "Egg",
    "Gluten",
    "Grain",
    "Peanut",
    "Seafood",
    "Sesame",
    "Shellfish",
    "Soy",
    "Sulfite",
    "Tree Nut",
    "Wheat",
  ];

  const typeList = [
    "main course",
    "side dish",
    "dessert",
    "appetizer",
    "salad",
    "bread",
    "breakfast",
    "soup",
    "snack",
  ];

  // fetch user's diet
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
        setDiet(data.profile.dietary_preferences);
      })
      .catch((err) => {
        setDiet("");
      });
    // Run this whenever currentUser changes
  }, [currentUser]);

  console.log(currentUser);

  const handleSubmit = (e) => {
    // Stops page from refreshing
    e.preventDefault();
    try {
      fetch(`${API_BASE_URL}${RECIPES_PATH}`, {
        params: {},
      })
        .then((response) => response.json())
        .then((data) => {
          // Reset form
        })
        .catch((err) => {
          alert(`Failed to get meal recipe`);
        });
    } catch (err) {
      alert(`Failed to get meal recipe`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <h1>Meal Recommendation</h1>

        <div>
          <p>Recipe Name</p>
          <input
            type="text"
            value={recipeName}
            placeholder={"Recipe name"}
            onChange={(e) => setRecipeName(e.target.value)}
          />
        </div>

        <div>
          <p>Ingredients To Include</p>
          <select
            name="ingredients"
            value={ingredientsIncluded}
            onChange={(e) => setIngredientsIncluded(e.target.value)}
          >
            <option value="">Select ingredients</option>
          </select>
        </div>

        <div>
          <p>Cuisine</p>
          <select
            name="cuisine"
            value={cuisine}
            placeholder={"Cuisine"}
            onChange={(e) => setCuisine(e.target.value)}
          >
            <option value="">Select Cuisine</option>
            <option value={""}>No preference</option>
            {cuisinesList.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p>Diet</p>
          <p>Following diet: {diet}</p>
        </div>

        <div>
          {/* TODO: let users pick multiple options */}
          <p>Intolerances</p>
          <select
            name="intolerances"
            value={intolerances}
            placeholder={"Intolerances"}
            onChange={(e) => setIntolerances(e.target.value)}
          >
            <option value="">Select intolerances</option>
            <option value={""}>No intolerances</option>
            {intolerancesList.map((intolerance) => (
              <option key={intolerance} value={intolerance}>
                {intolerance}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p>Meal Type</p>
          <select
            name="mealType"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select meal type</option>
            <option value={""}>No preference</option>

            {typeList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-1 w-full max-w-sm">
          <button type="submit" onClick={handleSubmit}>
            Suggest Meal
          </button>
        </div>
      </div>
    </form>
  );
}
