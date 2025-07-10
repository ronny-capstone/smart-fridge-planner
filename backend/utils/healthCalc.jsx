const heightToCm = (feet, inches) => {
  const feetNum = parseInt(feet);
  const inchesNum = parseInt(inches);

  const totalInches = feetNum * 12 + inchesNum;
  return Math.round(totalInches * 2.54);
};

const calculateBMR = (gender, age, weight_kg, height_feet, height_inches) => {
  if (gender === "Female") {
    return (
      447.593 +
      9.247 * weight_kg +
      3.098 * heightToCm(height_feet, height_inches) -
      4.33 * age
    );
  } else {
    return (
      88.362 +
      13.397 * weight_kg +
      4.799 * heightToCm(height_feet, height_inches) -
      5.677 * age
    );
  }
};

const calculateTDEE = (
  gender,
  age,
  activity,
  weight_kg,
  height_feet,
  height_inches
) => {
  let bmr = 0;
  if (gender === "Female") {
    bmr =
      10 * weight_kg +
      6.25 * heightToCm(height_feet, height_inches) -
      5 * age -
      161;
  } else {
    bmr =
      10 * weight_kg +
      6.25 * heightToCm(height_feet, height_inches) -
      5 * age +
      5;
  }

  if (activity === "Sedentary") {
    return bmr * 1.2;
  } else if (activity === "Lightly active") {
    return bmr * 1.375;
  } else if (activity === "Moderately active") {
    return bmr * 1.55;
  } else if (activity === "Very active") {
    return bmr * 1.725;
  } else if (activity === "Athlete") {
    return bmr * 1.9;
  }
};

const calculateMacroTargets = (tdee, health_goal) => {
  let calorieGoal = 0;
  let proteinGoal = 0;
  let carbGoal = 0;
  let fatGoal = 0;
  if (health_goal === "Lose weight") {
    // 10% deficit
    calorieGoal = tdee - tdee * 0.1;
    // 40% carbs, in grams
    carbGoal = (calorieGoal * 0.4) / 4;
    // 40% protein, in grams
    proteinGoal = (calorieGoal * 0.4) / 4;
    // 20% fats, in grams
    fatGoal = (calorieGoal * 0.2) / 9;
  } else if (health_goal === "Gain weight") {
    // 500 calorie surplus
    calorieGoal = tdee + 500;
    // 40% carbs, in grams
    carbGoal = (calorieGoal * 0.4) / 4;
    // 30% protein, in grams
    proteinGoal = (calorieGoal * 0.3) / 4;
    // 30% fats, in grams
    fatGoal = (calorieGoal * 0.3) / 9;
  } else if (health_goal === "Maintain weight") {
    calorieGoal = tdee;
    // 40% carbs, in grams
    carbGoal = (calorieGoal * 0.4) / 4;
    // 30% protein, in grams
    proteinGoal = (calorieGoal * 0.3) / 4;
    // 30% fats, in grams
    fatGoal = (calorieGoal * 0.3) / 9;
  }
  return {
    calorie_goal: Math.round(calorieGoal),
    protein_goal: Math.round(proteinGoal),
    carb_goal: Math.round(carbGoal),
    fat_goal: Math.round(fatGoal),
  };
};

module.exports = { calculateBMR, calculateTDEE, calculateMacroTargets };
