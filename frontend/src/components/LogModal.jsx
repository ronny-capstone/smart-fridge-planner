import { createPortal } from "react-dom";

export default function LogModal({
  children,
  onClose,
  itemResults,
  handleItemChosen,
  setItemResults,
}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const getNutrient = (nutrients, name) => {
    const nutrient = nutrients.find((n) => n.name === name);
    return nutrient ? nutrient.amount : 0;
  };

  const handleButtonClick = (item) => {
    setItemResults("");
    try {
      // Get nutritional information for the chosen item
      fetch(`${baseUrl}/food/nutrition?itemId=${item.id}`)
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json();
          } else {
            throw new Error("unexpected response format");
          }
        })
        .then((data) => {
          const newFoodItem = {
            name: data.name,
            calories: getNutrient(data.nutrition.nutrients, "Calories"),
            protein: getNutrient(data.nutrition.nutrients, "Protein"),
            carbs: getNutrient(data.nutrition.nutrients, "Net Carbohydrates"),
            fats: getNutrient(data.nutrition.nutrients, "Fat"),
            sugars: getNutrient(data.nutrition.nutrients, "Sugar"),
          };
          fetch(`${baseUrl}/food`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newFoodItem),
          })
            .then((res) => res.json())
            .then((data) => {
              handleItemChosen(data);
              onClose();
            })
            .catch((err) => {
              console.log(err.message);
            });
        })
        .catch((err) => {
          console.log(err.message);
        });
    } catch (err) {
      console.log("Failed to fetch info:", err.message);
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex justify-center items-center z-50 bg-black/30">
      <div className="bg-white w-full max-w-xl mx-4 p-6 rounded-lg shadow-lg relative">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✖
        </button>
        {itemResults &&
          itemResults.map((item) => {
            return (
              <div key={item.id}>
                <button onClick={() => handleButtonClick(item)}>
                  {" "}
                  {item.name}{" "}
                </button>
              </div>
            );
          })}
      </div>
    </div>,
    document.body
  );
}
