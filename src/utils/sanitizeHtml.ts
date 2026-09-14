/**
 * Minimal allowlist sanitizer for Notepad content.
 *
 * The allowlist mirrors the TipTap schema configured in NoteEditor.tsx, so
 * anything the editor cannot produce is stripped. TipTap already discards
 * unknown nodes when it parses content, but notes are persisted as raw HTML —
 * this keeps what we send to and accept from the API bounded as well.
 */

// Tags the editor can emit: paragraph, headings, hard break, marks.
const ALLOWED_TAGS = new Set([
  "P", "H2", "H3", "BR", "STRONG", "B", "EM", "I", "U", "SPAN", "MARK",
]);

// Only inline colour declarations survive on the style attribute.
const ALLOWED_STYLE_PROPS = new Set(["color", "background-color"]);

// Rejects url(...), expression(...), and other non-colour payloads.
const SAFE_STYLE_VALUE = /^[#a-zA-Z0-9\s(),.%-]+$/;

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx === -1) return "";
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return "";
      if (!value || !SAFE_STYLE_VALUE.test(value)) return "";
      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeElement(el: Element): void {
  // Walk a static copy: children are re-parented while we iterate.
  Array.from(el.children).forEach(sanitizeElement);

  if (!ALLOWED_TAGS.has(el.tagName)) {
    // Unwrap rather than drop, so the user's text survives.
    el.replaceWith(...Array.from(el.childNodes));
    return;
  }

  for (const attr of Array.from(el.attributes)) {
    if (attr.name.toLowerCase() !== "style") {
      el.removeAttribute(attr.name);
      continue;
    }
    const style = sanitizeStyle(attr.value);
    if (style) {
      el.setAttribute("style", style);
    } else {
      el.removeAttribute("style");
    }
  }
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body.querySelectorAll("script, style").forEach((n) => n.remove());
  Array.from(doc.body.children).forEach(sanitizeElement);
  return doc.body.innerHTML;
}
