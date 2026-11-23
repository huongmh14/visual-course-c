/**
 * Ephemeral toast notification banner.
 */

export function createToaster(containerEl) {
  return {
    show(message, durationMs = 2600) {
      if (!containerEl) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.textContent = message;
      containerEl.appendChild(toast);
      setTimeout(() => toast.remove(), durationMs);
    }
  };
}
