export const listToString = (listObject, optionalListObject) => {
  let groceryString =
    "Grocery List - " + new Date().toISOString().split("T")[0] + "\n";
  groceryString += "-------------------------" + "\n";
  listObject.forEach((item) => {
    let itemString =
      item.name +
      " - $" +
      item.itemCost +
      ", quantity: " +
      item.quantity +
      " " +
      item.unit;
    groceryString += itemString + "\n";
  });

  let optionalString = "\n";
  if (optionalListObject.length > 0) {
    optionalListObject.forEach((item) => {
      optionalString += item.name + " - " + item.reason + "\n";
    });

    groceryString += "\n" + "You may want to buy: ";
    groceryString += optionalString;
  }

  return groceryString;
};
