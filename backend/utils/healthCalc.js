const BMR_CONSTANTS = {
  WOMAN: {
    BASE: 447.593,
    WEIGHT_FACTOR: 9.247,
    HEIGHT_FACTOR: 3.098,
    AGE_FACTOR: 4.33,
  },
  MAN: {
    BASE: 88.362,
    WEIGHT_FACTOR: 13.397,
    HEIGHT_FACTOR: 4.799,
    AGE_FACTOR: 5.677,
  },
};

const TDEE_CONSTANTS = {
  W_BASE: 161,
  M_BASE: 5,
  WEIGHT_FACTOR: 10,
  HEIGHT_FACTOR: 6.25,
  AGE_FACTOR: 5,
  SEDENTARY: 1.2,
  LIGHT_ACTIVE: 1.375,
  MODERATE_ACTIVE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const MACRO_CONSTANTS = {
  PROTEIN_CARBS_CALS: 4,
  FATS_CALS: 9,
  CARBS_LOSS: 0.4,
  CARBS_GAIN: 0.4,
  CARBS_MAINTAIN: 0.4,
  PROTEIN_LOSS: 0.4,
  PROTEIN_GAIN: 0.3,
  PROTEIN_MAINTAIN: 0.3,
  FATS_LOSS: 0.2,
  FATS_GAIN: 0.3,
  FATS_MAINTAIN: 0.3,
};

const CALORIE_ADJUSTMENTS = {
  DEFICIT_PERCENT: 0.1,
  SURPLUS_CALORIES: 500,
};

const GENDERS = {
  WOMAN: "woman",
  MAN: "man",
};

const ACTIVITY_LEVELS = {
  SEDENTARY: "Sedentary",
  LIGHTLY_ACTIVE: "Lightly active",
  MODERATELY_ACTIVE: "Moderately active",
  ACTIVE: "Active",
  VERY_ACTIVE: "Very active",
};

const HEALTH_GOALS = {
  LOSE_WEIGHT: "Lose weight",
  GAIN_WEIGHT: "Gain weight",
  MAINTAIN_WEIGHT: "Maintain weight",
};

const heightToCm = (feet, inches) => {
  const feetNum = parseInt(feet);
  const inchesNum = parseInt(inches);

  const totalInches = feetNum * 12 + inchesNum;
  return Math.round(totalInches * 2.54);
};

const calculateBMR = (gender, age, weight_kg, height_feet, height_inches) => {
  const constants =
    gender === GENDERS.WOMAN ? BMR_CONSTANTS.WOMAN : BMR_CONSTANTS.MAN;
  return (
    constants.BASE +
    constants.WEIGHT_FACTOR * weight_kg +
    constants.HEIGHT_FACTOR * heightToCm(height_feet, height_inches) -
    constants.AGE_FACTOR * age
  );
};

const calculateTDEE = (
  gender,
  age,
  activity,
  weight_kg,
  height_feet,
  height_inches
) => {
  let bmr =
    TDEE_CONSTANTS.WEIGHT_FACTOR * weight_kg +
    TDEE_CONSTANTS.HEIGHT_FACTOR * heightToCm(height_feet, height_inches) -
    TDEE_CONSTANTS.AGE_FACTOR * age;

  bmr += gender === GENDERS.WOMAN ? -TDEE_CONSTANTS.W_BASE : TDEE_CONSTANTS.M_BASE;
  
  if (activity === ACTIVITY_LEVELS.SEDENTARY) {
    return bmr * TDEE_CONSTANTS.SEDENTARY;
  } else if (activity === ACTIVITY_LEVELS.LIGHTLY_ACTIVE) {
    return bmr * TDEE_CONSTANTS.LIGHT_ACTIVE;
  } else if (activity === ACTIVITY_LEVELS.MODERATELY_ACTIVE) {
    return bmr * TDEE_CONSTANTS.MODERATE_ACTIVE;
  } else if (activity === ACTIVITY_LEVELS.ACTIVE) {
    return bmr * TDEE_CONSTANTS.ACTIVE;
  } else if (activity === ACTIVITY_LEVELS.VERY_ACTIVE) {
    return bmr * TDEE_CONSTANTS.VERY_ACTIVE;
  }
};

const calculateMacroTargets = (tdee, health_goal) => {
  let calorieGoal = 0;
  let proteinGoal = 0;
  let carbGoal = 0;
  let fatGoal = 0;
  if (health_goal === HEALTH_GOALS.LOSE_WEIGHT) {
    // 10% deficit
    calorieGoal = tdee - tdee * CALORIE_ADJUSTMENTS.DEFICIT_PERCENT;
    // 40% carbs, in grams
    carbGoal =
      (calorieGoal * MACRO_CONSTANTS.CARBS_LOSS) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 40% protein, in grams
    proteinGoal =
      (calorieGoal * MACRO_CONSTANTS.PROTEIN_LOSS) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 20% fats, in grams
    fatGoal =
      (calorieGoal * MACRO_CONSTANTS.FATS_LOSS) / MACRO_CONSTANTS.FATS_CALS;
  } else if (health_goal === HEALTH_GOALS.GAIN_WEIGHT) {
    // 500 calorie surplus
    calorieGoal = tdee + CALORIE_ADJUSTMENTS.SURPLUS_CALORIES;
    // 40% carbs, in grams
    carbGoal =
      (calorieGoal * MACRO_CONSTANTS.CARBS_GAIN) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 30% protein, in grams
    proteinGoal =
      (calorieGoal * MACRO_CONSTANTS.PROTEIN_GAIN) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 30% fats, in grams
    fatGoal =
      (calorieGoal * MACRO_CONSTANTS.FATS_GAIN) / MACRO_CONSTANTS.FATS_CALS;
  } else if (health_goal === HEALTH_GOALS.MAINTAIN_WEIGHT) {
    calorieGoal = tdee;
    // 40% carbs, in grams
    carbGoal =
      (calorieGoal * MACRO_CONSTANTS.CARBS_MAINTAIN) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 30% protein, in grams
    proteinGoal =
      (calorieGoal * MACRO_CONSTANTS.PROTEIN_MAINTAIN) /
      MACRO_CONSTANTS.PROTEIN_CARBS_CALS;
    // 30% fats, in grams
    fatGoal =
      (calorieGoal * MACRO_CONSTANTS.FATS_MAINTAIN) / MACRO_CONSTANTS.FATS_CALS;
  }
  return {
    calorie_goal: Math.round(calorieGoal),
    protein_goal: Math.round(proteinGoal),
    carb_goal: Math.round(carbGoal),
    fat_goal: Math.round(fatGoal),
  };
};

module.exports = { calculateBMR, calculateTDEE, calculateMacroTargets };