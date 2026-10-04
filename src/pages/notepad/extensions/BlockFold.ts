import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * VS Code-style block folding / minimizing extension.
 *
 * Adds a single dropdown chevron (▼ / ▶) on the FIRST line of each text block:
 * - For a Heading (H2/H3): folds all child content under that heading until the next heading.
 *   CRITICAL: A heading NEVER folds another heading! All headings always remain visible.
 * - For a Paragraph block: folds all subsequent lines of that paragraph group into the first line.
 *
 * Built purely as ProseMirror widget and node decorations so the saved note HTML
 * remains completely clean and untouched.
 */

interface BlockFoldState {
  folded: Set<number>;
}

export const blockFoldKey = new PluginKey<BlockFoldState>("blockFold");

// Chevron icons matching VS Code gutter fold controls
const CHEVRON_DOWN_ICON = `<svg class="np-fold-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

const CHEVRON_RIGHT_ICON = `<svg class="np-fold-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`;

function createFoldButton(isFolded: boolean, onToggle: () => void): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `np-fold-toggle${isFolded ? " is-folded" : ""}`;
  button.title = isFolded ? "Click to expand block" : "Click to minimize block (VS Code style)";
  button.setAttribute("aria-label", isFolded ? "Expand block" : "Minimize block");
  button.setAttribute("aria-expanded", String(!isFolded));
  button.contentEditable = "false";
  button.innerHTML = isFolded ? CHEVRON_RIGHT_ICON : CHEVRON_DOWN_ICON;

  button.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });

  return button;
}

function createFoldedBadge(onToggle: () => void): HTMLElement {
  const badge = document.createElement("span");
  badge.className = "np-fold-badge";
  badge.title = "Click to expand / unfold";
  badge.setAttribute("aria-label", "Click to expand");
  badge.contentEditable = "false";
  badge.textContent = "···";

  badge.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  badge.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  });

  return badge;
}

interface RawBlock {
  pos: number;
  node: ProseMirrorNode;
  nodeSize: number;
  isHeading: boolean;
  level: number;
  isEmpty: boolean;
}

interface FoldableBlock {
  firstPos: number;
  firstNode: ProseMirrorNode;
  isHeading: boolean;
  level: number;
  childBlocks: Array<{ pos: number; nodeSize: number }>;
}

/**
 * Partition the document into distinct text blocks.
 * Rules:
 * 1. Only the FIRST line of each text block receives a dropdown toggle.
 * 2. A heading STOPS immediately when ANY next heading is reached or at an empty line separating sections.
 *    CRITICAL: A heading NEVER swallows other headings or subsequent blocks! All headlines always remain visible.
 * 3. Paragraph blocks stop at empty lines or headings.
 */
function collectFoldableBlocks(doc: ProseMirrorNode): FoldableBlock[] {
  const raw: RawBlock[] = [];
  doc.forEach((node, offset) => {
    if (node.isTextblock) {
      const isHeading = node.type.name === "heading";
      const level = isHeading ? (node.attrs.level ?? 2) : 0;
      const isEmpty = node.textContent.trim().length === 0;
      raw.push({
        pos: offset,
        node,
        nodeSize: node.nodeSize,
        isHeading,
        level,
        isEmpty,
      });
    }
  });

  const foldable: FoldableBlock[] = [];
  let i = 0;

  while (i < raw.length) {
    const current = raw[i];

    // Blank lines do not start a foldable block
    if (current.isEmpty) {
      i++;
      continue;
    }

    if (current.isHeading) {
      // Heading block: collects child blocks UNTIL the next heading or section boundary
      const children: Array<{ pos: number; nodeSize: number }> = [];
      let j = i + 1;
      while (j < raw.length) {
        const next = raw[j];
        // Stop immediately at ANY next heading
        if (next.isHeading) break;

        // If an empty line is encountered after non-empty content, it marks the end of this block
        if (next.isEmpty) {
          if (children.some((c) => !raw.find((r) => r.pos === c.pos)?.isEmpty)) {
            break;
          }
        } else {
          children.push({ pos: next.pos, nodeSize: next.nodeSize });
        }
        j++;
      }

      foldable.push({
        firstPos: current.pos,
        firstNode: current.node,
        isHeading: true,
        level: current.level,
        childBlocks: children,
      });

      i = j;
    } else {
      // Paragraph block: group of consecutive non-empty paragraphs
      // Stops at any empty line or heading
      const children: Array<{ pos: number; nodeSize: number }> = [];
      let j = i + 1;
      while (j < raw.length) {
        const next = raw[j];
        if (next.isEmpty || next.isHeading) {
          break;
        }
        children.push({ pos: next.pos, nodeSize: next.nodeSize });
        j++;
      }

      foldable.push({
        firstPos: current.pos,
        firstNode: current.node,
        isHeading: false,
        level: 0,
        childBlocks: children,
      });

      i = j;
    }
  }

  return foldable;
}

function buildDecorations(
  doc: ProseMirrorNode,
  folded: Set<number>,
  onToggle: (pos: number) => void
): DecorationSet {
  const decorations: Decoration[] = [];
  const textBlocks = collectFoldableBlocks(doc);

  if (textBlocks.length === 0) {
    return DecorationSet.create(doc, []);
  }

  // Precompute the first line / headline position of EVERY block
  const allFirstPositions = new Set(textBlocks.map((b) => b.firstPos));

  for (const block of textBlocks) {
    // Only blocks with child content or multi-line paragraphs have a fold toggle
    const canFold = block.childBlocks.length > 0 || block.firstNode.textContent.length > 80;
    if (!canFold) {
      continue;
    }

    const isFolded = folded.has(block.firstPos);

    if (isFolded) {
      // First line gets parent class (remains ALWAYS 100% visible!)
      decorations.push(
        Decoration.node(block.firstPos, block.firstPos + block.firstNode.nodeSize, {
          class: block.isHeading
            ? "is-folded-parent"
            : (block.childBlocks.length > 0 ? "is-folded-parent" : "is-folded-paragraph"),
        })
      );

      // Folded badge indicator [···] right after the first line's text
      decorations.push(
        Decoration.widget(
          block.firstPos + block.firstNode.nodeSize - 1,
          () => createFoldedBadge(() => onToggle(block.firstPos)),
          {
            side: 1,
            ignoreSelection: true,
            stopEvent: () => true,
            key: `np-fold-badge-${block.firstPos}`,
          }
        )
      );

      // Hide only child lines in this text block.
      // STRICT SAFETY GUARANTEES:
      // 1. Never hide a heading node (H2, H3, etc.)
      // 2. Never hide the first line / headline of ANY block in the document
      for (const child of block.childBlocks) {
        const node = doc.nodeAt(child.pos);
        if (!node || node.type.name === "heading" || allFirstPositions.has(child.pos)) {
          continue;
        }

        decorations.push(
          Decoration.node(child.pos, child.pos + child.nodeSize, {
            class: "is-folded-child",
          })
        );
      }
    }

    // Only render the dropdown toggle on the FIRST line of this text block!
    decorations.push(
      Decoration.widget(
        block.firstPos + 1,
        () => createFoldButton(isFolded, () => onToggle(block.firstPos)),
        {
          side: -1,
          ignoreSelection: true,
          stopEvent: () => true,
          key: `np-fold-btn-${block.firstPos}-${isFolded ? "folded" : "open"}`,
        }
      )
    );
  }

  return DecorationSet.create(doc, decorations);
}

// Module-level reference to the active EditorView to ensure transactions dispatch reliably
let activeEditorView: EditorView | null = null;

export const BlockFold = Extension.create({
  name: "blockFold",

  addProseMirrorPlugins() {
    return [
      new Plugin<BlockFoldState>({
        key: blockFoldKey,
        view(editorView) {
          activeEditorView = editorView;
          return {
            update(v) {
              activeEditorView = v;
            },
            destroy() {
              activeEditorView = null;
            },
          };
        },
        state: {
          init: () => ({ folded: new Set<number>() }),
          apply: (tr, prev) => {
            const meta = tr.getMeta(blockFoldKey) as { togglePos?: number } | undefined;
            if (meta?.togglePos !== undefined) {
              const next = new Set(prev.folded);
              if (next.has(meta.togglePos)) {
                next.delete(meta.togglePos);
              } else {
                next.add(meta.togglePos);
              }
              return { folded: next };
            }

            if (tr.docChanged && prev.folded.size > 0) {
              const mapped = new Set<number>();
              for (const pos of prev.folded) {
                const target = tr.mapping.map(pos, 1);
                if (target < tr.doc.content.size) {
                  const $pos = tr.doc.resolve(target);
                  const blockPos = $pos.depth >= 1 ? $pos.before(1) : target;
                  mapped.add(blockPos);
                }
              }
              return { folded: mapped };
            }

            return prev;
          },
        },
        props: {
          decorations(state) {
            const pluginState = blockFoldKey.getState(state);
            const folded = pluginState?.folded ?? new Set<number>();
            return buildDecorations(state.doc, folded, (pos) => {
              if (!activeEditorView) return;
              const tr = activeEditorView.state.tr.setMeta(blockFoldKey, { togglePos: pos });
              activeEditorView.dispatch(tr);
            });
          },
        },
      }),
    ];
  },
});

export default BlockFold;
