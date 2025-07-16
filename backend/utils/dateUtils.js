const formatDateString = (dateString) => {
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getDaysUntilExpiration = (expirationDate) => {
  const today = new Date();
  const expireDate = new Date(expirationDate);
  const timeDifference = expireDate.getTime() - today.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return daysDifference;
};

module.exports = { formatDateString, getDaysUntilExpiration };