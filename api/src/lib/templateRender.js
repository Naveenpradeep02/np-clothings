/**
 * Replace {{key}} placeholders.
 */
export function renderTemplate(bodyTemplate, vars = {}) {
  return String(bodyTemplate).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const val = vars[key];
    return val == null ? '' : String(val);
  });
}

export default { renderTemplate };
