import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { PROFILE_PATH } from "../utils/paths";
import { GENERATE_PATH, GROCERY_LIST_PATH, EXPORT_PATH } from "../utils/paths";
import { listToString } from "../utils/listToString";
import { capitalize } from "../utils/stringUtils";
import { formatDay } from "../utils/dateUtils";
import { toast } from "react-toastify";

export default function GroceryRecForm({ currentUser }) {
  const [form, setForm] = useState({
    result: null,
    noResults: false,
    isSearching: false,
    diet: "",
    budget: "",
    mealsNum: "",
    allowRepeats: "",
    useDiet: true,
    maxRepeats: "",
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
      result: null,
      noResults: false,
    }));
  };

  const clearForm = () => {
    setForm((prev) => ({
      ...prev,
      isSearching: false,
      diet: "",
      budget: "",
      mealsNum: "",
      allowRepeats: "",
      useDiet: true,
      maxRepeats: "",
    }));
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleExport = (groceryListText) => {
    fetch(`${API_BASE_URL}${GROCERY_LIST_PATH}${EXPORT_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groceryListText }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then(({ fileName, data }) => {
        // Create blob with data
        const blob = new Blob([data], { type: "text/plain" });
        // Create temporary URL that points to blob
        const url = URL.createObjectURL(blob);
        // Create temporary anchor element to trigger download
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        // Click anchor to start download
        a.click();
        // Clean up by removing temporary URL
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.log("Error exporting groceries");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.budget === "" || form.mealsNum === "") {
      toast.error("Please fill out all fields.");
      return;
    }
    
    setForm((prev) => ({ ...prev, isSearching: true, noResults: false }));
    const params = new URLSearchParams({
      budget: form.budget,
      totalMeals: form.mealsNum,
      allowRepeats: form.allowRepeats,
      maxRepeats: form.maxRepeats,
    });

    try {
      fetch(
        `${API_BASE_URL}${GROCERY_LIST_PATH}${GENERATE_PATH}/${currentUser}?${params}`
      )
        .then((response) => response.json())
        .then((data) => {
          setForm((prev) => ({
            ...prev,
            result: data,
            noResults: data.groceries.mealPlan.length === 0,
            isSearching: false,
          }));
        })
        .catch((err) => {
          toast.error("Failed to get grocery list recommendations");
          setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
        });
    } catch (err) {
      toast.error("Failed to get grocery list recommendations");
      setForm((prev) => ({ ...prev, noResults: true, isSearching: false }));
    }
  };

  return (
    <div>
      <h1>Grocery List Generator</h1>
      <p>Get personalized grocery recommendations</p>
      <div>
        <label>Budget: $</label>
        <input
          type="number"
          name="budget"
          value={form.budget}
          onChange={handleChange}
          min="1"
          required
        ></input>
      </div>
      <div>
        <label>Number of meals:</label>
        <input
          type="number"
          name="mealsNum"
          value={form.mealsNum}
          onChange={handleChange}
          min="1"
          max="21"
        ></input>
      </div>
      <div>
        <input
          type="checkbox"
          name="allowRepeats"
          checked={form.allowRepeats}
          onChange={handleChange}
        ></input>
        <label>Allow repeat meals:</label>
      </div>
      <div>
        <label>Max number of repeated meals:</label>
        <input
          type="number"
          name="maxRepeats"
          value={form.maxRepeats}
          onChange={handleChange}
          min="1"
          max="5"
          disabled={!form.allowRepeats}
        ></input>
      </div>

      <div className="mb-1 w-full max-w-sm">
        <button type="button" onClick={clearForm}>
          Clear Filters
        </button>
      </div>

      {form.result && (
        <button type="button" onClick={clearResults}>
          Clear Results
        </button>
      )}

      <div className="mb-1 w-full max-w-sm">
        <button type="submit" onClick={handleSubmit}>
          Generate Grocery List
        </button>
      </div>

      {form.result && !form.noResults && (
        <div>
          <div>
            <p>
              Total cost: ${form.result.groceries.totalCost} out of $
              {form.budget} budget
            </p>
          </div>
          <div>
            <p>Budget Used: {form.result.budgetUsed}%</p>
          </div>

          <div>
            <p>Meals planned: {form.result.groceries.mealPlan.length}</p>
          </div>
          <div>
            <h3>Meal Plan:</h3>
            {form.result.groceries.mealPlan.map((meal, index) => (
              <div key={index}>
                <p>
                  Meal {meal.mealNumber}: {meal.title}
                </p>
              </div>
            ))}
          </div>
          <div>
            <h3>Shopping List:</h3>
            <p>Items to buy: {form.result.groceries.itemsNeeded}</p>
            {form.result.groceries.shoppingList.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {form.result.groceries.shoppingList.map((item, index) => (
                  <div key={index} className="border p-2 justify-between">
                    <p>
                      {capitalize(item.name)} - ${item.itemCost}
                    </p>
                    <p>
                      Quantity: {item.quantity} {item.unit}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items needed - you have everything!</p>
            )}
          </div>

          <div>
            <h3>Expiring items used in meal plan:</h3>
            {form.result.groceries.expiringItems.length > 0 &&
              form.result.groceries.expiringItems.map((item, index) => (
                <div key={index}>
                  <p>
                    {capitalize(item.name)} :{" "}
                    {item.daysLeft === 0
                      ? "expires today"
                      : item.daysLeft > 0
                      ? `expires in ${formatDay(item.daysLeft)}`
                      : `expired ${formatDay(item.daysLeft)} ago`}
                  </p>
                </div>
              ))}
          </div>

          <div>
            <button
              onClick={() =>
                handleExport(
                  listToString(
                    form.result.groceries.shoppingList,
                    form.result.groceries.inventoryRecommendations
                  )
                )
              }
            >
              Export grocery list
            </button>
          </div>

          {/* Items that aren't used for recipes, are running out/expired */}
          {form.result.groceries.inventoryRecommendations &&
            form.result.groceries.inventoryRecommendations.length > 0 && (
              <div>
                <p>While you're at the store, you may want to buy: </p>
                {form.result.groceries.inventoryRecommendations.map(
                  (item, index) => (
                    <div
                      key={index}
                      className={`border p-3 rounded ${
                        item.type === "expiring-replacement"
                          ? "bg-orange-50 border-orange-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <p>{capitalize(item.name)}</p>
                      <p>{item.reason}</p>
                    </div>
                  )
                )}
              </div>
            )}
        </div>
      )}

      {form.isSearching && (
        <div className="flex flex-col items-center justify-center py-6 space-y-3">
          <p className="text-lg font-medium text-gray-700">
            Generating grocery list...
          </p>
          <img src="/infinityLoading.gif" alt="Loading" className="w-32 h-32" />
        </div>
      )}

      {form.noResults && !form.isSearching && (
        <div>
          <p> Grocery list could not be generated. </p>
        </div>
      )}
    </div>
  );
}
