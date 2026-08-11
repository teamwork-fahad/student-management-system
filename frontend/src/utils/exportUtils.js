/**
 * Export array of data rows to a CSV/Excel file with UTF-8 BOM formatting.
 *
 * @param {string} filename - Desired filename without extension.
 * @param {Array<{label: string, key: string|Function}>} headers - Column definitions.
 * @param {Array<Object>} rows - Data objects to export.
 */
export const exportToCSV = (filename, headers, rows) => {
  if (!headers || !headers.length || !rows) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    let str = typeof val === "object" ? JSON.stringify(val) : String(val);
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map((h) => escapeCSV(h.label)).join(",");
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.key === "function" ? h.key(row) : row[h.key];
        return escapeCSV(val);
      })
      .join(",")
  );

  // \uFEFF is UTF-8 BOM so Excel opens the CSV with correct character encoding
  const csvContent = "\uFEFF" + [headerLine, ...rowLines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
