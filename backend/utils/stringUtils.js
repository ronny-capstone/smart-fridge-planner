const isNameMatch = (ingredient, inventoryItem) => {
  const ingredientName = ingredient.name.toLowerCase();
  const inventoryName = inventoryItem.name.toLowerCase();

  // Exact match
  if (ingredientName === inventoryName) {
    return true;
  }

  // Check for plurals
  if (
    ingredientName + "s" === inventoryName ||
    inventoryName + "s" === ingredientName
  ) {
    return true;
  }

  return false;
};

module.exports = { isNameMatch };
