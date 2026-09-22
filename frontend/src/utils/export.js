export function downloadCsv(days, filename = "trackyourlife.csv") {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [["date", "score", "note", "is_public"], ...days.map((day) => [day.date, day.score, day.note, day.is_public])];
  const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
