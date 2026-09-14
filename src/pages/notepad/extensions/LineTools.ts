import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";

/**
 * VS Code-style line productivity shortcuts.
 *
 *   Alt + Shift + ArrowDown    duplicate the current line(s) downward
 *   Alt + ArrowUp / ArrowDown  move the current line(s) up or down
 *
 * "Line" means a whole top-level block, so formatting (heading level, marks,
 * colours, highlights) travels with the content. Everything goes through
 * ProseMirror transactions — no DOM manipulation.
 */

type Dispatch = ((tr: Transaction) => void) | undefined;

/** Boundaries of the top-level blocks the selection touches. */
function selectedBlockRange(state: EditorState): { from: number; to: number } | null {
  const { $from, $to } = state.selection;
  if ($from.depth < 1 || $to.depth < 1) return null;
  return { from: $from.before(1), to: $to.after(1) };
}

/** Re-apply the caret/selection after content moved by `shift` positions. */
function shiftSelection(tr: Transaction, from: number, to: number, shift: number): void {
  const size = tr.doc.content.size;
  const start = Math.max(0, Math.min(size, from + shift));
  const end = Math.max(0, Math.min(size, to + shift));
  tr.setSelection(TextSelection.create(tr.doc, start, end));
}

export function duplicateLines(state: EditorState, dispatch: Dispatch): boolean {
  const range = selectedBlockRange(state);
  if (!range) return false;

  const { from, to } = range;
  const slice = state.doc.slice(from, to);
  if (!slice.content.size) return false;

  if (dispatch) {
    const { from: selFrom, to: selTo } = state.selection;
    const tr = state.tr.insert(to, slice.content);
    // Leave the caret in the new copy, mirroring VS Code.
    shiftSelection(tr, selFrom, selTo, to - from);
    dispatch(tr.scrollIntoView());
  }

  return true;
}

export function moveLines(state: EditorState, dispatch: Dispatch, direction: -1 | 1): boolean {
  const range = selectedBlockRange(state);
  if (!range) return false;

  const { from, to } = range;
  const neighbour =
    direction === -1 ? state.doc.resolve(from).nodeBefore : state.doc.resolve(to).nodeAfter;
  // Already at the top or bottom of the document.
  if (!neighbour) return false;

  if (dispatch) {
    const { from: selFrom, to: selTo } = state.selection;
    const slice = state.doc.slice(from, to);
    const tr = state.tr;

    tr.delete(from, to);

    if (direction === -1) {
      // Positions before `from` are untouched by the delete above.
      const target = from - neighbour.nodeSize;
      tr.insert(target, slice.content);
      shiftSelection(tr, selFrom, selTo, -neighbour.nodeSize);
    } else {
      // After the delete the following block starts at `from`.
      tr.insert(from + neighbour.nodeSize, slice.content);
      shiftSelection(tr, selFrom, selTo, neighbour.nodeSize);
    }

    dispatch(tr.scrollIntoView());
  }

  return true;
}

export const LineTools = Extension.create({
  name: "lineTools",

  addKeyboardShortcuts() {
    // Always report the key as handled, even when the command no-ops at the
    // top or bottom of the document, so the browser never gets to scroll or
    // extend the selection behind our back.
    const run = (fn: (state: EditorState, dispatch: Dispatch) => boolean) => () => {
      this.editor.commands.command(({ state, dispatch }) => fn(state, dispatch));
      return true;
    };

    return {
      "Alt-Shift-ArrowDown": run(duplicateLines),
      "Alt-ArrowUp": run((state, dispatch) => moveLines(state, dispatch, -1)),
      "Alt-ArrowDown": run((state, dispatch) => moveLines(state, dispatch, 1)),
    };
  },
});

export default LineTools;
