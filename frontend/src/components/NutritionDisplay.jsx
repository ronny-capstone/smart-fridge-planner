import { useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/api";
import { LOG_PATH, PROFILE_PATH, FOOD_PATH } from "../utils/paths";

export default function NutritionDisplay({ currentUser }) {
  const [calorieGoal, setCalorieGoal] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatsGoal, setFatsGoal] = useState(0);
  const [bmr, setBmr] = useState(0);
  const [tdee, setTdee] = useState(0);
  const [calorieProgress, setCalorieProgress] = useState("");
  const [proteinProgress, setProteinProgress] = useState("");
  const [carbProgress, setCarbProgress] = useState("");
  const [fatsProgress, setFatsProgress] = useState("");
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  const [caloriesConsumed, setCaloriesConsumed] = useState(0);
  const [proteinConsumed, setProteinConsumed] = useState(0);
  const [carbsConsumed, setCarbsConsumed] = useState(0);
  const [fatsConsumed, setFatsConsumed] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    // Fetch nutritional data for current user
    fetch(`${API_BASE_URL}${PROFILE_PATH}/${currentUser}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Profile not found");
        }
      })
      .then((data) => {
        // Sets state to 0 if value is undefined
        setCalorieGoal(parseInt(data.profile.calorie_goal) || 0);
        setProteinGoal(parseInt(data.profile.protein_goal) || 0);
        setCarbGoal(parseInt(data.profile.carb_goal) || 0);
        setFatsGoal(parseInt(data.profile.fat_goal) || 0);
        setBmr(data.profile.bmr || 0);
        setTdee(data.profile.tdee || 0);
        setGoalsLoaded(true);
      })
      .catch((err) => {
        console.log("Failed to fetch nutrition data");
      });
  }, [currentUser]);

  const fetchTodaysConsumption = () => {
    fetch(`${API_BASE_URL}${LOG_PATH}/${currentUser}/today`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error fetching logs");
        }
      })
      .then((logs) => {
        if (logs.length === 0) {
          alert("No food logged yet today");
          // Set progress to 0
          setCalorieProgress(0);
          setProteinProgress(0);
          setCarbProgress(0);
          setFatsProgress(0);
          return;
        }
        // Calculate daily macro totals
        let daily_calories = 0;
        let daily_protein = 0;
        let daily_carbs = 0;
        let daily_fats = 0;
        let logCount = 0;

        logs.forEach((log) => {
          // Get food item to find spoonacular id
          fetch(`${API_BASE_URL}${FOOD_PATH}/${log.item_id}`)
            .then((response) => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error("Food item not found");
              }
            })
            .then((data) => {
              const servings = log.servings || 1;
              daily_calories += (data.calories ?? 0) * servings;
              daily_protein += (data.protein ?? 0) * servings;
              daily_carbs += (data.carbs ?? 0) * servings;
              daily_fats += (data.fats ?? 0) * servings;

              logCount++;

              // Check if we're done with logs
              if (logCount === logs.length) {
                // Calculate percentages
                const percentages = percentDailyGoals(
                  daily_calories,
                  daily_protein,
                  daily_carbs,
                  daily_fats
                );

                // Set consumed amount
                setCaloriesConsumed(daily_calories);
                setProteinConsumed(daily_protein);
                setCarbsConsumed(daily_carbs);
                setFatsConsumed(daily_fats);

                // Set percentages
                setCalorieProgress(percentages.percentCalories);
                setProteinProgress(percentages.percentProtein);
                setCarbProgress(percentages.percentCarbs);
                setFatsProgress(percentages.percentFats);
              }
            })
            .catch((err) => {
              logCount++;
              if (logCount === logs.length) {
                const percentages = percentDailyGoals(
                  daily_calories,
                  daily_protein,
                  daily_carbs,
                  daily_fats
                );

                setCalorieProgress(percentages.percentCalories);
                setProteinProgress(percentages.percentProtein);
                setCarbProgress(percentages.percentCarbs);
                setFatsProgress(percentages.percentFats);
              }
            })
            .catch((err) => {
              setCalorieProgress(0);
              setProteinProgress(0);
              setCarbProgress(0);
              setFatsProgress(0);
            });
        });
      });
  };

  useEffect(() => {
    if (goalsLoaded && currentUser) {
      fetchTodaysConsumption();
    }
  }, [goalsLoaded, currentUser]);

  const percentDailyGoals = (
    daily_calories,
    daily_protein,
    daily_carbs,
    daily_fats
  ) => {
    const percentCalories = ((daily_calories / calorieGoal) * 100).toFixed(1);
    const percentProtein = ((daily_protein / proteinGoal) * 100).toFixed(1);
    const percentCarbs = ((daily_carbs / carbGoal) * 100).toFixed(1);
    const percentFats = ((daily_fats / fatsGoal) * 100).toFixed(1);

    return { percentCalories, percentProtein, percentCarbs, percentFats };
  };

  const getStatusColor = (percentProgress) => {
    if (percentProgress >= 100) {
      return "bg-green-100 text-green-800 border-green-200";
    } else if (percentProgress >= 75) {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (percentProgress >= 50) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <div>
      <h1>Nutritional Targets</h1>

      <h3>Daily Values:</h3>

      <div>
        <p> Calorie Goal</p>
        <p>{caloriesConsumed}kcal / {calorieGoal}kcal</p>
        <p className={getStatusColor(calorieProgress)}>
          {" "}
          {calorieProgress}% progress to goal
        </p>
      </div>

      <div>
        <p>Protein Goal</p>
        <p>{proteinConsumed}g / {proteinGoal}g</p>
        <p className={getStatusColor(proteinProgress)}>
          {" "}
          {proteinProgress}% progress to goal
        </p>
      </div>

      <div>
        <p>Carbs Goal</p>
        <p>{carbsConsumed}g / {carbGoal}g</p>
        <p className={getStatusColor(carbProgress)}>
          {" "}
          {carbProgress}% progress to goal
        </p>
      </div>

      <div>
        <p>Fats Goal</p>
        <p>{fatsConsumed}g / {fatsGoal}g</p>
        <p className={getStatusColor(fatsProgress)}>
          {fatsProgress}% progress to goal
        </p>
      </div>

      <h3> Nutrition Info: </h3>

      <div>
        <p>BMR</p>
        <p>{bmr}</p>
      </div>

      <div>
        <p>TDEE</p>
        <p>{tdee}</p>
      </div>
    </div>
  );
}
