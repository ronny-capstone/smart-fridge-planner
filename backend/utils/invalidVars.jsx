const checkInvalidVariable = (variable) => {
  return variable === undefined || variable === null || variable === "";
};

module.exports = checkInvalidVariable;
