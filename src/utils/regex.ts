export function escapeRegExp(text: string) {
  // Escape only special characters, not spaces
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createFlexibleRegex(str: string) {
  if (typeof str === "string") {
    const res = str
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special characters
      .replace(/\\\(/g, "(.*?)") // Replace \( with (.*?) to match any character
      .replace(/\\\)/g, "(.*?)"); // Replace \) with (.*?) to match any character
    return res;
  }
  return "";
}

export const newRegExp = (str: string, sensitive: string = "") =>
  new RegExp(`^${escapeRegExp(str.toString().trim())}$`.trim(), sensitive);
