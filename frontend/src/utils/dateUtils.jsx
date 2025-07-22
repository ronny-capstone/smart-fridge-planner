export const formatDateString = (dateString) => {
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getDaysUntilExpiration = (expirationDate) => {
  const today = new Date();
  const expireDate = new Date(expirationDate);
  const timeDifference = expireDate.getTime() - today.getTime();
  const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
  return daysDifference;
};

export const getExpirationStatus = (expirationDate) => {
  const days = getDaysUntilExpiration(expirationDate);
  if (days < 0) {
    return "Expired";
  } else if (days <= 3) {
    return "Expiring soon";
  } else if (days <= 7) {
    return "Expiring this week";
  }
  return "Fresh";
};

export const formatDay = (days) => {
  const dayString = days === 1 ? "day" : "days";
  return `${Math.abs(days)} ${dayString}`;
};
