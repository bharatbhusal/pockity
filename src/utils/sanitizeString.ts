export function sanitizeString(string: string): string {
  // Replace spaces with underscores and remove unsafe characters
  return string
    .trim()
    .replace(/\s+/g, "_") // spaces → underscores
    .replace(/[^a-zA-Z0-9._-]/g, ""); // strip unsafe chars
}
