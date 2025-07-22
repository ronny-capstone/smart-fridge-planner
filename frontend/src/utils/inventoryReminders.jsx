import { getDaysUntilExpiration } from "./dateUtils";
import { toast } from "react-toastify";
import { saveReminderDismissal, getDismissedReminders } from "./reminders";
import { STOCK_CONSTANTS, EXPIRATION_CONSTANTS } from "./remindersConstants";
import { capitalize } from "./stringUtils";

const AUTOCLOSE = 3000;

const getIconAndColor = (type, days) => {
  if (type === "expired") {
    return {
      icon: "🚫",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-800",
    };
  } else if (type === "expiration") {
    return {
      icon: "⏰",
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-800",
    };
  } else if (type === "low_stock") {
    return {
      icon: "📦",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-800",
    };
  }
};



const splitButtons = (closeToast, name, days, type, stock, itemId, userId) => {
  const handleDontShowAgain = async () => {
    await saveReminderDismissal(userId, itemId, type);
    closeToast();
  };

  const { icon, color, textColor } = getIconAndColor(type, days);

  // Styling from: https://fkhadra.github.io/react-toastify/how-to-style/
  return (
    <div className={`${color} grid grid-cols-[1fr_1px_100px] w-[500px]`}>
      <div className="flex flex-col p-2">
        <span>{icon}</span>
        {type === "expiration" ? (
          <p className={`font-medium ${textColor}`}>
            {capitalize(name)} expires{" "}
            {days === EXPIRATION_CONSTANTS.EXPIRES_TODAY
              ? "today"
              : days === EXPIRATION_CONSTANTS.EXPIRES_TOMORROW
              ? "tomorrow"
              : `in ${days} days`}
          </p>
        ) : type === "expired" ? (
          <p className={`font-medium ${textColor}`}>{capitalize(name)} has expired!</p>
        ) : (
          <p className={`font-medium ${textColor}`}>
            Running low on {name} ({stock} left)
          </p>
        )}
      </div>
      <div className="bg-zinc-900/20 h-full" />
      <div className="grid grid-rows-[1fr_1px_1fr] h-full text-sm">
        <button onClick={() => closeToast()} className="text-blue-600">
          Dismiss
        </button>
        <div className="bg-zinc-900/20 w-full" />
        <button onClick={handleDontShowAgain}>Hide Reminder</button>
      </div>
    </div>
  );
};

export const checkExpiringItems = async (inventory, userId) => {
  const dismissedReminders = await getDismissedReminders(userId);
  const permanently_dismissed = dismissedReminders
    .filter(
      (reminder) =>
        reminder.reminder_type === "expiration" ||
        (reminder.reminder_type === "expired" &&
          reminder.notified === "dont_show_again")
    )
    .map((reminder) => reminder.item_id);

  inventory.forEach((item) => {
    if (!permanently_dismissed.includes(item.item_id)) {
      const expirationDays = getDaysUntilExpiration(item.expiration_date);

      if (expirationDays < EXPIRATION_CONSTANTS.EXPIRES_TODAY) {
        toast(
          ({ closeToast }) =>
            splitButtons(
              closeToast,
              item.name,
              Math.abs(expirationDays),
              "expired",
              "",
              item.item_id,
              userId
            ),
          {
            autoClose: AUTOCLOSE,
            className: "p-0 w-[400px] border border-purple-600/40",
          }
        );
      } else if (expirationDays === EXPIRATION_CONSTANTS.EXPIRES_TODAY) {
        toast(
          ({ closeToast }) =>
            splitButtons(
              closeToast,
              item.name,
              EXPIRATION_CONSTANTS.EXPIRES_TODAY,
              "expiration",
              "",
              item.item_id,
              userId
            ),
          {
            autoClose: AUTOCLOSE,
            className: "p-0 w-[400px] border border-purple-600/40",
          }
        );
      } else if (expirationDays === EXPIRATION_CONSTANTS.EXPIRES_TOMORROW) {
        toast(
          ({ closeToast }) =>
            splitButtons(
              closeToast,
              item.name,
              EXPIRATION_CONSTANTS.EXPIRES_TOMORROW,
              "expiration",
              "",
              item.item_id,
              userId
            ),
          {
            autoClose: AUTOCLOSE,
            className: "p-0 w-[400px] border border-purple-600/40",
          }
        );
      } else if (expirationDays <= EXPIRATION_CONSTANTS.EXPIRES_SOON) {
        toast(
          ({ closeToast }) =>
            splitButtons(
              closeToast,
              item.name,
              expirationDays,
              "expiration",
              "",
              item.item_id,
              userId
            ),
          {
            autoClose: AUTOCLOSE,
            className: "p-0 w-[400px] border border-purple-600/40",
          }
        );
      }
    }
  });
};

export const checkLowStock = async (inventory, userId) => {
  const dismissedReminders = await getDismissedReminders(userId);
  const permanently_dismissed = dismissedReminders
    .filter(
      (reminder) =>
        reminder.reminder_type === "low_stock" &&
        reminder.notified === "dont_show_again"
    )
    .map((reminder) => reminder.item_id);

  inventory.forEach((item) => {
    if (!permanently_dismissed.includes(item.item_id)) {
      if (item.quantity <= STOCK_CONSTANTS.LOW_STOCK) {
        toast(
          ({ closeToast }) =>
            splitButtons(
              closeToast,
              item.name,
              "",
              "low_stock",
              item.quantity,
              item.item_id,
              userId
            ),
          {
            autoClose: AUTOCLOSE,
            className: "p-0 w-[400px] border border-purple-600/40",
          }
        );
      }
    }
  });
};
