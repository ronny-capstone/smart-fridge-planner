const WEIGHT_VALUES = {
  balanced: {
    name: "Balanced",
    weights: {
      dietWeight: 0.25,
      mealPrepWeight: 0.2,
      macrosWeight: 0.2,
      cuisineWeight: 0.15,
      expiringWeight: 0.2,
    },
  },
  quickMeals: {
    name: "Quick Meals",
    weights: {
      dietWeight: 0.2,
      mealPrepWeight: 0.4,
      macrosWeight: 0.15,
      cuisineWeight: 0.1,
      expiringWeight: 0.15,
    },
  },
  fitnessGoals: {
    name: "Fitness Goals",
    weights: {
      dietWeight: 0.25,
      mealPrepWeight: 0.1,
      macrosWeight: 0.4,
      cuisineWeight: 0.1,
      expiringWeight: 0.15,
    },
  },
  reduceWaste: {
    name: "Reduce Food Waste",
    weights: {
      dietWeight: 0.2,
      mealPrepWeight: 0.15,
      macrosWeight: 0.15,
      cuisineWeight: 0.1,
      expiringWeight: 0.4,
    },
  },
  cuisineExplorer: {
    name: "Cuisine Explorer",
    weights: {
      dietWeight: 0.2,
      mealPrepWeight: 0.15,
      macrosWeight: 0.15,
      cuisineWeight: 0.35,
      expiringWeight: 0.15,
    },
  },
};

module.exports = { WEIGHT_VALUES };
