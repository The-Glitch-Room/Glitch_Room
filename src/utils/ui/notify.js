// src/utils/ui/notify.js
export const NOTIFICATION_EVENT = "gr_notification";
export const NOTIFICATION_DISMISS_EVENT = "gr_notification_dismiss";

const DEFAULT_DURATION_MS = 4000;

/**
 * Dispatch a global non-blocking UI notification (replaces browser alert()).
 *
 * @param {string} message - Primary message to display.
 * @param {object} [options]
 * @param {"info"|"success"|"warning"|"error"} [options.type="info"] - Visual variant.
 * @param {string} [options.title] - Optional short heading.
 * @param {number} [options.duration=4000] - Auto-dismiss delay in ms (0 = persistent).
 * @param {string} [options.id] - Optional dedupe ID to update an existing toast.
 */
export function notify(message, options = {}) {
  if (typeof window === "undefined" || !message) return;

  const {
    type = "info",
    title = "",
    duration = DEFAULT_DURATION_MS,
    id,
  } = options;

  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: {
        id,
        type,
        title,
        message: String(message),
        duration,
      },
    }),
  );
}

notify.info = (message, options = {}) =>
  notify(message, { ...options, type: "info" });

notify.success = (message, options = {}) =>
  notify(message, { ...options, type: "success" });

notify.warning = (message, options = {}) =>
  notify(message, { ...options, type: "warning" });

notify.error = (message, options = {}) =>
  notify(message, { ...options, type: "error" });

notify.dismiss = (id) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_DISMISS_EVENT, { detail: { id } }),
  );
};
