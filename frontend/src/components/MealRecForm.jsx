import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { RECIPES_PATH, PROFILE_PATH } from "../utils/paths";
import { cuisinesList } from "../utils/mealFilters";

export default function MealRecForm({ currentUser }) {
  const [form, setForm] = useState({
    recipes: [],
    result: null,
    noResults: false,
    isSearching: false,
    ingredientType: "exact",
    prioritizeExpiring: false,
    selectedPriority: "balanced",
    cuisine: "",
    diet: "",
    useDiet: true,
    maxPrepTime: "",
    minCarbs: 0,
    maxCarbs: 0,
    minProtein: 0,
    maxProtein: 0,
    minCalories: 0,
    maxCalories: 0,
    minFat: 0,
    maxFat: 0,
  });

  // Fetch user's diet from profile
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
        setForm((prev) => ({
          ...prev,
          useDiet: true,
          diet: data.profile.dietary_preferences,
        }));
      })
      .catch((err) => {
        setForm((prev) => ({ ...prev, useDiet: false, diet: "" }));
      });
  }, [currentUser]);

  const clearResults = () => {
    setForm((prev) => ({
      ...prev,
      recipes: [],
      result: null,
      noResults: false,
    }));
  };

  const clearForm = () => {
    setForm((prev) => ({
      ...prev,
      cuisine: "",
      minCarbs: 0,
      maxCarbs: 0,
      minProtein: 0,
      maxProtein: 0,
      minCalories: 0,
      maxCalories: 0,
      minFat: 0,
      maxFat: 0,
      noResults: false,
      isSearching: false,
      maxPrepTime: "",
      prioritizeExpiring: false,
      ingredientType: "exact",
      selectedPriority: "balanced",
      result: null,
      recipes: [],
    }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setForm((prev) => ({ ...prev, isSearching: true, noResults: false }));
    const params = new URLSearchParams();
    const queryParams = {
      ingredientType: form.ingredientType,
      maxPrepTime: form.maxPrepTime,
      cuisine: form.cuisine,
      minCalories: form.minCalories,
      maxCalories: form.maxCalories,
      minCarbs: form.minCarbs,
      maxCarbs: form.maxCarbs,
      minProtein: form.minProtein,
      maxProtein: form.maxProtein,
      minFat: form.minFat,
      maxFat: form.maxFat,
      expirationToggle: form.prioritizeExpiring,
      priority: form.selectedPriority,
      useDiet: form.useDiet,
    };

    Object.entries(queryParams).forEach(([key, value]) => {
      // Append only if value exists
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });

    fetch(
      `${API_BASE_URL}${RECIPES_PATH}/recommendations/${currentUser}?${params}`
    )
      .then((response) => response.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          recipes: data.recipes,
          result: {
            type: "recommendations",
            recipeCount: data.numFound,
            message: data.message,
            ingredientType: data.ingredientType,
          },
          noResults: data.recipes.length === 0,
          isSearching: false,
        }));
      })
      .catch((err) => {
        alert("Failed to get recipe recommendations");
        setForm((prev) => ({ ...prev, isSearching: false }));
      });
  };

  return (
    <div>
      <h1>Meal Recommendation</h1>

      <div>
        <label>Meal Prioritization:</label>
        <select
          name="selectedPriority"
          value={form.selectedPriority}
          onChange={handleChange}
        >
          <option value="balanced">Balanced</option>
          <option value="quickMeals">Quick Meals</option>
          <option value="fitnessGoals">Fitness Goals</option>
          <option value="reduceWaste">Reduce Waste</option>
          <option value="cuisineExplorer">Cuisine Explorer</option>
        </select>
      </div>
      <div>
        <label>
          Recipe Ingredients:
          <select
            name="ingredientType"
            value={form.ingredientType}
            onChange={handleChange}
          >
            <option value="exact">Use only what I have</option>
            <option value="partial">Allow missing ingredients</option>
          </select>
        </label>

        {form.diet !== "None" && (
          <div>
            <label>
              <input
                name="useDiet"
                type="checkbox"
                checked={form.useDiet}
                onChange={handleChange}
              />
              Apply Diet Filter ({form.diet}):
            </label>
          </div>
        )}

        <div>
          <label>
            Prioritize Expiring Items:
            <input
              name="prioritizeExpiring"
              type="checkbox"
              checked={form.prioritizeExpiring}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Meal Prep Time (minutes):
            <input
              name="maxPrepTime"
              type="number"
              value={form.maxPrepTime}
              onChange={handleChange}
            />
          </label>
        </div>

        <label>
          Cuisine:
          <select
            name="cuisine"
            value={form.cuisine}
            onChange={handleChange}
            placeholder={"Cuisine"}
          >
            <option value="">Select Cuisine</option>
            <option value={""}>No preference</option>
            {cuisinesList.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p>Nutrition Filters</p>
          <p>Calories</p>
          <div>
            <div>
              <label>Min:</label>
              <input
                type="number"
                min="0"
                name="minCalories"
                value={form.minCalories || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Max:</label>
              <input
                type="number"
                min="0"
                name="maxCalories"
                value={form.maxCalories || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div>
          <p>Protein</p>
          <div>
            <div>
              <label>Min:</label>
              <input
                type="number"
                min="0"
                name="minProtein"
                value={form.minProtein || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Max:</label>
              <input
                type="number"
                min="0"
                name="maxProtein"
                value={form.maxProtein || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div>
          <p>Carbohydrates</p>
          <div>
            <div>
              <label>Min:</label>
              <input
                type="number"
                min="0"
                name="minCarbs"
                value={form.minCarbs || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Max:</label>
              <input
                type="number"
                min="0"
                name="maxCarbs"
                value={form.maxCarbs || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div>
          <p>Fats</p>
          <div>
            <div>
              <label>Min:</label>
              <input
                type="number"
                min="0"
                name="minFat"
                value={form.minFat || ""}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Max:</label>
              <input
                type="number"
                min="0"
                name="maxFat"
                value={form.maxFat || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-1 w-full max-w-sm">
          <button type="button" onClick={clearForm}>
            Clear Filters
          </button>
        </div>

        {form.recipes.length > 0 && (
          <button type="button" onClick={clearResults}>
            Clear Results
          </button>
        )}
      </div>

      <div className="mb-1 w-full max-w-sm">
        <button type="submit" onClick={handleSubmit}>
          Suggest Meal
        </button>
      </div>

      {form.result && !form.isSearching && (
        <div>
          <p>{form.result.message}</p>
          {form.result.type === "exact" && (
            <p>Using {form.result.itemsUsed} items from your inventory</p>
          )}
          {form.result.type === "partial" && (
            <p>
              Recipes with up to {form.result.maxMissing} missing ingredients
            </p>
          )}

          {form.result.type === "expiring" && form.result.expiringItems && (
            <div>
              <p>Using items expiring soon:</p>
              {form.result.expiringItems.map((item) => (
                <p key={item.name}>
                  {item.name} - {item.numDaysExpiring} days to expiration
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {form.recipes.length > 0 && !form.isSearching && (
        <div>
          <h2> Recipe Recommendations ({form.recipes.length}) </h2>
          {form.recipes.map((recipe) => (
            <div key={recipe.id}>
              <img src={recipe.image} alt={recipe.title} />
              <p> {recipe.title} </p>
              <p>Match Score: {recipe.totalScore}% match</p>
              <p>Prep time: {recipe.readyInMinutes} minutes</p>
              {recipe.cuisines.length !== 0 && (
                <p>Cuisines: {recipe.cuisines.join(", ")}</p>
              )}
              <p>
                {recipe.usedIngredients.length || 0} ingredients used from
                inventory
              </p>
              <p>
                {recipe.missedIngredients.length > 0 && (
                  <>
                    {" "}
                    {recipe.missedIngredients.length} missing (
                    {recipe.missedIngredients.map((ing) => ing.name).join(", ")}
                    )
                  </>
                )}
              </p>

              {recipe.usedExpiringIngredients && (
                <>
                  <p>Uses {recipe.usedExpiringIngredients} expiring items</p>
                  <ul>
                    {recipe.usedExpiringIngredients.map((item, index) => (
                      <li key={index}>
                        {item.name} - expires in {item.daysUntilExpire} days
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {form.noResults && !form.isSearching && (
        <div>
          <p> No recipes found, try adjusting search criteria. </p>
        </div>
      )}
    </div>
  );
}
