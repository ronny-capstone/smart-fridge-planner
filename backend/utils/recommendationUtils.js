const { DIETS } = require("./recipeConstants.js");
const { getDaysUntilExpiration } = require("./dateUtils.js");

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

// Following Fisher-Yates implementation
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const copyArray = (array, desiredLength) => {
  if (array.length === 0) {
    return [];
  }
  const extendedArray = [];
  for (let i = 0; i < desiredLength; i++) {
    // % creates repeating cycle
    extendedArray.push(array[i % array.length]);
  }
  return extendedArray;
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

module.exports = { shuffleArray, copyArray, getExpiringItems, dietMatch };
