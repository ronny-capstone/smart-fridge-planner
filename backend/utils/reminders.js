import { API_BASE_URL } from "../../frontend/src/utils/api";
const REMINDERS_PATH = require("./backend_paths.js");

const saveReminderDismissal = async (
  userId,
  itemId,
  reminderType,
  status = "dont_show_again"
) => {
  try {
    const response = await fetch(`${API_BASE_URL}${REMINDERS_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        user_id: userId,
        item_id: itemId,
        reminder_type: reminderType,
        reminder_date: new Date().toISOString(),
        notified: status,
      }),
    });
    return response.ok;
  } catch (err) {
    return false;
  }
};

const getDismissedReminders = async (userId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${REMINDERS_PATH}?user_id=${userId}&notified=dismissed`,
      {
        credentials: include,
      }
    );
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (err) {
    return [];
  }
};

module.exports = { saveReminderDismissal, getDismissedReminders };
