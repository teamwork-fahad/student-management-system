/**
 * Formats a Date object or string into DD/MM/YYYY format.
 * Example: "2026-08-06" -> "06/08/2026"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return "N/A";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "N/A";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return "N/A";
  }
};
