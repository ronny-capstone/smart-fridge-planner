import { useState, useEffect } from "react";

export default function FoodItemForm({ handleItemAdded }) {
  const [foodItem, setFoodItem] = useState("");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (foodItem.trim() === "") {
      alert("Please fill out all fields.");
      return;
    }

    try {
      fetch(`${baseUrl}/food/search?query=${encodeURIComponent(foodItem)}`)
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new Error("Unexpected response format");
          }
        })
        .then((data) => {
          if (data.results && data.results.length > 0) {
            const searchResults = data.results.map((item) => {
              return {
                id: item.id,
                name: item.name,
                image: item.image || null,
              };
            });
            handleItemAdded(searchResults);
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      console.log("Failed to submit form:", err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-start p-6 bg-gray-50">
        <h1 className="text-xl font-bold mb-6">Add New Food Item</h1>

        <div className="mb-4 w-full max-w-sm">
          <div className="mb-4 w-full max-w-sm">
            <label className="block mb-1 font-medium">Food item:</label>
            <input
              className="w-full border border-gray-400 rounded px-2 py-1 hover:bg-gray-100"
              name="foodItem"
              value={foodItem}
              onChange={(e) => setFoodItem(e.target.value)}
            />
          </div>
          <div className="mb-1 w-full max-w-sm">
            <button
              type="submit"
              className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 transition mb-2"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
