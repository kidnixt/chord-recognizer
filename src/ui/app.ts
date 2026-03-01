export function updateOutput(text: string) {
  const el = document.getElementById("output");
  if (el) el.textContent = text;
}
