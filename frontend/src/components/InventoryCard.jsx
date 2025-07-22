import {
  formatDateString,
  getDaysUntilExpiration,
  getExpirationStatus,
  formatDay,
} from "../utils/dateUtils";

export default function InventoryCard({ item, handleEdit, handleDelete }) {
  const expirationStatus = getExpirationStatus(item.expiration_date);
  const daysUntil = getDaysUntilExpiration(item.expiration_date);

  const getStatusColor = (status) => {
    if (status === "Expired") {
      return "bg-red-100 text-red-800 border-red-200";
    } else if (status === "Expiring soon") {
      return "bg-orange-100 text-orange-800 border-orange-200";
    } else if (status === "Expiring this week") {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    } else {
      return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusMessage = () => {
    if (expirationStatus == "Expired") {
      return `Expired ${formatDay(daysUntil)} ago`;
    } else if (expirationStatus == "Expiring soon") {
      return `Expires in ${formatDay(daysUntil)}`;
    } else if (expirationStatus == "Expiring this week") {
      return `Expires in ${formatDay(daysUntil)}`;
    } else if (expirationStatus == "Fresh") {
      return `Fresh (${daysUntil} days left)`;
    }
    return "Unknown";
  };

  return (
    <div className="itemCard">
      <h3 className="item-name">{item.name}</h3>
      <p className={getStatusColor(expirationStatus)}> {getStatusMessage()} </p>
      <p>Expires: {formatDateString(item.expiration_date)}</p>
      <p>Servings: {item.quantity}</p>

      <button onClick={() => handleEdit(item)}>Edit</button>
      <button onClick={() => handleDelete(item)}>Remove</button>
    </div>
  );
}
