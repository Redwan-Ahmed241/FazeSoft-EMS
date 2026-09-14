import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Adds a hover-revealed "copy" button to every logical paragraph.
 *
 * A logical paragraph is a run of consecutive non-empty blocks of the same
 * type. Pressing Enter creates a new ProseMirror paragraph node, so a passage
 * the user thinks of as one paragraph is usually several nodes — those are
 * grouped together behind a single button. A blank line (an empty block) or a
 * change of block type ends the group, which keeps headings separate from the
 * prose that follows them.
 *
 * The buttons are widget decorations, so they live purely in the view layer and
 * can never appear in `editor.getHTML()` or the saved note.
 */

const blockCopyKey = new PluginKey<DecorationSet>("blockCopyButton");

const FEEDBACK_MS = 1200;

// Lucide "copy" and "check" glyphs, inlined so the widget stays plain DOM.
const ICONS = `
<svg class="np-copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
<svg class="np-copy-done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

interface ParagraphGroup {
  /** Position of the first block in the group. */
  pos: number;
  /** Plain text of every block in the group, one per line. */
  text: string;
  /** Document range each block covers, for the hover decorations. */
  blocks: Array<{ from: number; to: number }>;
}

/**
 * Identity a block must share to stay in the same group. Headings include
 * their level, so a Headline followed by a Subtitle stays two groups.
 */
function blockKind(node: ProseMirrorNode): string {
  const level = node.attrs.level;
  return level === undefined ? node.type.name : `${node.type.name}:${level}`;
}

/** Split the document into logical paragraphs. */
function collectGroups(doc: ProseMirrorNode): ParagraphGroup[] {
  const groups: ParagraphGroup[] = [];
  let current: ParagraphGroup | null = null;
  let currentType: string | null = null;

  doc.forEach((node, offset) => {
    const isCopyable = node.isTextblock && node.textContent.trim().length > 0;

    // A blank line or a non-text block closes the current paragraph.
    if (!isCopyable) {
      current = null;
      currentType = null;
      return;
    }

    // A different block kind starts a new paragraph, so a heading never merges
    // into the body text beneath it.
    const kind = blockKind(node);
    if (!current || currentType !== kind) {
      current = { pos: offset, text: node.textContent, blocks: [] };
      currentType = kind;
      groups.push(current);
    } else {
      current.text += `\n${node.textContent}`;
    }

    current.blocks.push({ from: offset, to: offset + node.nodeSize });
  });

  return groups;
}

function createCopyButton(groupIndex: number, getText: () => string): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "np-copy";
  button.title = "Copy this paragraph";
  button.setAttribute("aria-label", "Copy this paragraph");
  button.setAttribute("data-np-group", String(groupIndex));
  // Keep the widget out of the editable flow entirely.
  button.contentEditable = "false";
  button.innerHTML = ICONS;

  let timer: ReturnType<typeof setTimeout> | undefined;

  const flash = (state: "is-copied" | "is-failed", label: string) => {
    button.classList.remove("is-copied", "is-failed");
    button.classList.add(state);
    button.setAttribute("data-feedback", label);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      button.classList.remove("is-copied", "is-failed");
      button.removeAttribute("data-feedback");
    }, FEEDBACK_MS);
  };

  button.addEventListener("mousedown", (event) => {
    // Never let the click move the caret or start a selection.
    event.preventDefault();
    event.stopPropagation();
  });

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(getText());
      flash("is-copied", "Copied");
    } catch {
      flash("is-failed", "Copy failed");
    }
  });

  return button;
}

function buildDecorations(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = [];

  collectGroups(doc).forEach((group, index) => {
    // One button per logical paragraph, anchored in its first block.
    decorations.push(
      Decoration.widget(group.pos + 1, () => createCopyButton(index, () => group.text), {
        side: -1,
        // The widget is chrome, not content: keep it out of selection and stop
        // its events from reaching the editor.
        ignoreSelection: true,
        stopEvent: () => true,
        key: `np-copy-${index}-${group.pos}-${group.text.length}`,
      })
    );

    // Tag every block in the group so hovering any of them reveals the button.
    group.blocks.forEach(({ from, to }) => {
      decorations.push(Decoration.node(from, to, { "data-np-group": String(index) }));
    });
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Reveal the button belonging to the hovered group.
 *
 * CSS alone cannot express "hovering any block in this group reveals the button
 * inside the first one", so the hovered group is tracked here. Only a class on
 * the widget itself is touched — the document is never modified.
 */
function createHoverTracker() {
  let hovered: string | null = null;

  return (view: EditorView, group: string | null) => {
    if (group === hovered) return;
    hovered = group;

    view.dom
      .querySelectorAll(".np-copy.is-hovered")
      .forEach((el) => el.classList.remove("is-hovered"));

    if (group !== null) {
      view.dom
        .querySelector(`.np-copy[data-np-group="${group}"]`)
        ?.classList.add("is-hovered");
    }
  };
}

export const BlockCopyButton = Extension.create({
  name: "blockCopyButton",

  addProseMirrorPlugins() {
    const setHoveredGroup = createHoverTracker();

    return [
      new Plugin<DecorationSet>({
        key: blockCopyKey,
        state: {
          init: (_config, state) => buildDecorations(state.doc),
          // Recompute only when the document actually changes, so selection and
          // caret movement never rebuild the buttons.
          apply: (tr, old) => (tr.docChanged ? buildDecorations(tr.doc) : old),
        },
        props: {
          decorations(state) {
            return blockCopyKey.getState(state);
          },
          handleDOMEvents: {
            mouseover: (view, event) => {
              const target = event.target as HTMLElement | null;
              const owner = target?.closest?.("[data-np-group]") ?? null;
              setHoveredGroup(view, owner?.getAttribute("data-np-group") ?? null);
              return false;
            },
            mouseleave: (view) => {
              setHoveredGroup(view, null);
              return false;
            },
          },
        },
      }),
    ];
  },
});

export default BlockCopyButton;
