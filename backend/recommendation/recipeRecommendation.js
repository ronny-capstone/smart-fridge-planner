const baseUrl = process.env.VITE_API_BASE_URL;
const axios = require("axios");
const { getDaysUntilExpiration } = require("../utils/dateUtils.js");
const { WEIGHT_VALUES } = require("../utils/weightValues.js");
const { RECIPES_PATH } = require("../utils/backend_paths.js");

const EXACT_PATH = "/exact";
const PARTIAL_PATH = "/partial";
const {
  PRIORITY_CONSTANTS,
  DIETS,
  PREP_CONSTANTS,
  CUISINE_CONSTANTS,
  INGREDIENT_TYPES,
  NUTRIENT_CONSTANTS,
  MACRO_CONSTANTS,
  PREP_BUCKETS,
} = require("../utils/recipeConstants.js");

const recipeRecommendation = async (
  ingredientType,
  userFilters,
  userProfile,
  inventory
) => {
  const {
    expirationToggle = false,
    cuisine = null,
    maxPrepTime = null,
    minCalories = null,
    maxCalories = null,
    minProtein = null,
    maxProtein = null,
    minCarbs = null,
    maxCarbs = null,
    minFat = null,
    maxFat = null,
    useDiet = true,
  } = userFilters;
  const TIMEOUT = 3000;
  const MAX_MISSING_INGREDIENTS = 3;
  const EXPIRATION_THRESHOLD = 5;

  const selectedPriority = userFilters.priority;
  const weights = WEIGHT_VALUES[selectedPriority].weights;
  const {
    dietWeight,
    mealPrepWeight,
    macrosWeight,
    cuisineWeight,
    expiringWeight,
  } = weights;

  // Fetch recipes
  let recipes = [];
  try {
    let response;
    if (ingredientType === INGREDIENT_TYPES.EXACT) {
      response = await axios.get(
        `${baseUrl}${RECIPES_PATH}${EXACT_PATH}/${userProfile.id}`,
        {
          // timeout after 8 seconds
          timeout: TIMEOUT,
        }
      );
    } else if (ingredientType === INGREDIENT_TYPES.PARTIAL) {
      response = await axios.get(
        `${baseUrl}${RECIPES_PATH}${PARTIAL_PATH}/${userProfile.id}`,
        {
          params: {
            maxMissing: MAX_MISSING_INGREDIENTS,
          },
          // timeout after 8 seconds
          timeout: TIMEOUT,
        }
      );
    }

    recipes = response.data.recipes || [];
  } catch (err) {
    throw err;
  }

  const userDiet = userProfile.dietary_preferences;

  // Exclude invalid recipes by diet
  if (useDiet && userDiet && userDiet !== DIETS.NONE) {
    recipes = recipes.filter((r) => dietMatch(r, userDiet));
  }

  if (recipes.length === 0) {
    return {
      recipes: [],
      numFound: 0,
      message: `No ${ingredientType} recipes found`,
    };
  }

  // Handle expiration toggle
  let expiringItems = [];
  let expiringScore = 0;
  if (expirationToggle) {
    expiringItems = getExpiringItems(inventory, EXPIRATION_THRESHOLD);
  }

  const recipeScores = recipes.map((recipe) => {
    // apply weighted scoring
    const dietScore = calculateDietScore(recipe, userDiet);
    const mealPrepScore = calculateMealPrepScore(recipe, maxPrepTime);
    const macrosScore = calculateMacroScore(recipe, {
      minCalories,
      maxCalories,
      minProtein,
      maxProtein,
      minCarbs,
      maxCarbs,
      minFat,
      maxFat,
    });
    const cuisineScore = calculateCuisineScore(recipe, cuisine);
    expiringScore = calculateExpiringScore(recipe, expiringItems);

    const totalScore =
      dietScore * dietWeight +
      mealPrepScore * mealPrepWeight +
      macrosScore * macrosWeight +
      cuisineScore * cuisineWeight +
      expiringScore * expiringWeight;

    return {
      ...recipe,
      scores: {
        diet: dietScore,
        mealPrep: mealPrepScore,
        macros: macrosScore,
        cuisine: cuisineScore,
        expiring: expiringScore,
      },
      totalScore: Math.round(totalScore),
    };
  });

  recipeScores.sort((a, b) => b.totalScore - a.totalScore);
  const topRecipes = recipeScores.slice(0, 10);

  return {
    recipes: topRecipes,
    numFound: topRecipes.length,
    ingredientType,
    message: `Found ${topRecipes.length} recipes!`,
  };
};

// Helper to get expiring items
const getExpiringItems = (inventory, daysUntilExpire) => {
  return inventory
    .filter(
      (item) =>
        getDaysUntilExpiration(item.expiration_date) <= daysUntilExpire &&
        getDaysUntilExpiration(item.expiration_date) >= 0
    )
    .sort((a, b) => {
      return (
        getDaysUntilExpiration(a.expiration_date) -
        getDaysUntilExpiration(b.expiration_date)
      );
    });
};

const dietMatch = (recipe, userDiet) => {
  const diet = userDiet.toLowerCase();
  if (diet === DIETS.VEGAN) {
    return recipe.vegan;
  }
  if (diet === DIETS.VEGETARIAN) {
    return recipe.vegetarian;
  }
  if (diet === DIETS.GLUTEN_FREE) {
    return recipe.glutenFree;
  }
  if (diet === DIETS.KETOGENIC) {
    return recipe.ketogenic;
  }
  return true;
};

const calculateDietScore = (recipe, userDiet) => {
  return dietMatch(recipe, userDiet) ? 100 : 0;
};

const calculateMealPrepScore = (recipe, maxPrepTime) => {
  if (!maxPrepTime) {
    return PREP_CONSTANTS.NEUTRAL;
  }
  const recipePrepTime = recipe.readyInMinutes;
  // If over the user's max prep time, low score
  if (maxPrepTime && recipePrepTime > maxPrepTime) {
    return PREP_BUCKETS.OVER_MAX;
  }
  // Score based on time buckets
  if (recipePrepTime <= PREP_BUCKETS.BEST_TIME) {
    return PREP_BUCKETS.BEST_SCORE;
  }
  if (recipePrepTime <= PREP_BUCKETS.SECOND_BEST) {
    return PREP_BUCKETS.SECOND_SCORE;
  }
  if (recipePrepTime <= PREP_BUCKETS.THIRD_BEST) {
    return PREP_BUCKETS.THIRD_SCORE;
  }
  if (recipePrepTime <= PREP_BUCKETS.FOURTH_BEST) {
    return PREP_BUCKETS.FOURTH_SCORE;
  }
  if (recipePrepTime <= PREP_BUCKETS.FIFTH_BEST) {
    return PREP_BUCKETS.FIFTH_SCORE;
  }
  return PREP_BUCKETS.WORST;
};

const calculateMacroScore = (
  recipe,
  {
    minCalories,
    maxCalories,
    minProtein,
    maxProtein,
    minCarbs,
    maxCarbs,
    minFat,
    maxFat,
  }
) => {
  const calories = recipe.nutrition.nutrients.find(
    (nutrient) => nutrient.name === NUTRIENT_CONSTANTS.CALORIES
  );
  const carbs = recipe.nutrition.nutrients.find(
    (nutrient) => nutrient.name === NUTRIENT_CONSTANTS.CARBS
  );
  const fat = recipe.nutrition.nutrients.find(
    (nutrient) => nutrient.name === NUTRIENT_CONSTANTS.FAT
  );
  const protein = recipe.nutrition.nutrients.find(
    (nutrient) => nutrient.name === NUTRIENT_CONSTANTS.PROTEIN
  );

  const calorieScore = scoreMacro(calories, minCalories, maxCalories);
  const carbsScore = scoreMacro(carbs, minCarbs, maxCarbs);
  const proteinScore = scoreMacro(protein, minProtein, maxProtein);
  const fatScore = scoreMacro(fat, minFat, maxFat);
  const scores = [calorieScore, carbsScore, proteinScore, fatScore];
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(averageScore);
};

const scoreMacro = (value, min, max) => {
  if (value === null || value === undefined) {
    return MACRO_CONSTANTS.INVALID;
  }
  if (min !== null && value < min) {
    return (value / min) * 100;
  }
  if (max !== null && value > max) {
    return (max / value) * 100;
  }

  // value within range
  return MACRO_CONSTANTS.IN_RANGE;
};

const calculateCuisineScore = (recipe, cuisine) => {
  if (!cuisine) {
    return CUISINE_CONSTANTS.NEUTRAL;
  }
  if (recipe.cuisines.includes(cuisine)) {
    return CUISINE_CONSTANTS.SUCCESS;
  } else {
    return CUISINE_CONSTANTS.FAILURE;
  }
};

const calculateExpiringScore = (recipe, expiringItems) => {
  if (!expiringItems || expiringItems.length === 0) {
    return PRIORITY_CONSTANTS.NEUTRAL;
  }

  let priority = 0;
  const ingredients = recipe.extendedIngredients || recipe.usedIngredients;
  ingredients.forEach((ingredient) => {
    const expiringItem = expiringItems.find(
      (item) => ingredient.name.toLowerCase() === item.name.toLowerCase()
    );

    if (expiringItem) {
      const daysUntilExpire = getDaysUntilExpiration(
        expiringItem.expiration_date
      );
      if (daysUntilExpire <= PRIORITY_CONSTANTS.EXPIRING_PRIORITY_ONE_DAYS) {
        priority += PRIORITY_CONSTANTS.PRIORITY_ONE;
      } else if (
        daysUntilExpire <= PRIORITY_CONSTANTS.EXPIRING_PRIORITY_TWO_DAYS
      ) {
        priority += PRIORITY_CONSTANTS.PRIORITY_TWO;
      } else if (
        daysUntilExpire <= PRIORITY_CONSTANTS.EXPIRING_PRIORITY_THREE_DAYS
      ) {
        priority += PRIORITY_CONSTANTS.PRIORITY_THREE;
      }
    }
  });
  return priority;
};

module.exports = { recipeRecommendation };
