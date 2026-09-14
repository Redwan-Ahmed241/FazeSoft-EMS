import { useEffect, useRef, useState } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { Bold, Italic, Underline, Highlighter, Baseline, ChevronDown } from "lucide-react";
import { sanitizeHtml } from "../../utils/sanitizeHtml";
import { BlockCopyButton } from "./extensions/BlockCopyButton";
import { LineTools } from "./extensions/LineTools";

// Headline / Subtitle / Paragraph, mapped onto the schema's block nodes.
const BLOCK_STYLES = [
  { value: "h2", label: "Headline" },
  { value: "h3", label: "Subtitle" },
  { value: "p", label: "Paragraph" },
] as const;

const TEXT_COLORS = [
  { value: "", label: "Default" },
  { value: "#5932EA", label: "Purple" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#717182", label: "Grey" },
];

/**
 * Canonicalise a CSS colour for comparison.
 *
 * Colours are stored as hex here, but once a note round-trips through saved
 * HTML the browser reports them as `rgb(...)`. Normalising both sides keeps the
 * active swatch highlighted after a note is reloaded.
 */
const colorCanonCache = new Map<string, string>();

function canonicalColor(value: string): string {
  if (!value) return "";
  const cached = colorCanonCache.get(value);
  if (cached !== undefined) return cached;
  const probe = document.createElement("span");
  probe.style.color = value;
  const canonical = probe.style.color || value.toLowerCase();
  colorCanonCache.set(value, canonical);
  return canonical;
}

interface NoteEditorProps {
  /** Changes when a different tab is selected, so the editor reloads its document. */
  noteId: string;
  content: string;
  onChange: (html: string) => void;
}

export function NoteEditor({ noteId, content, onChange }: NoteEditorProps) {
  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Only the block types the toolbar exposes.
        heading: { levels: [2, 3] },
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        strike: false,
        horizontalRule: false,
        link: false,
      }),
      TextStyle,
      Color,
      Highlight,
      BlockCopyButton,
      LineTools,
    ],
    content: sanitizeHtml(content),
    editorProps: {
      attributes: { class: "np-editor-content" },
    },
    onUpdate: ({ editor: instance }) => onChange(sanitizeHtml(instance.getHTML())),
  });

  // Toolbar state, recomputed only when the relevant marks/nodes change.
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => {
      if (!instance) return null;
      return {
        bold: instance.isActive("bold"),
        italic: instance.isActive("italic"),
        underline: instance.isActive("underline"),
        highlight: instance.isActive("highlight"),
        block: instance.isActive("heading", { level: 2 })
          ? "h2"
          : instance.isActive("heading", { level: 3 })
          ? "h3"
          : "p",
        color: instance.getAttributes("textStyle").color ?? "",
      };
    },
  });

  // Swap the document when the user switches tabs.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(sanitizeHtml(content), { emitUpdate: false });
    // Only react to the tab change: `content` updates on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor]);

  // Dismiss the colour menu on an outside click.
  useEffect(() => {
    if (!colorOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!colorRef.current?.contains(event.target as Node)) setColorOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [colorOpen]);

  if (!editor || !state) return null;

  const setBlock = (value: string) => {
    const chain = editor.chain().focus();
    if (value === "h2") chain.setNode("heading", { level: 2 }).run();
    else if (value === "h3") chain.setNode("heading", { level: 3 }).run();
    else chain.setParagraph().run();
  };

  const setColor = (value: string) => {
    const chain = editor.chain().focus();
    if (value) chain.setColor(value).run();
    else chain.unsetColor().run();
    setColorOpen(false);
  };

  return (
    <div className="np-editor">
      <div className="np-toolbar">
        <select
          className="np-select"
          value={state.block}
          onChange={(event) => setBlock(event.target.value)}
          aria-label="Text style"
        >
          {BLOCK_STYLES.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>

        <span className="np-toolbar-divider" />

        <button
          type="button"
          className={`np-tool${state.bold ? " is-active" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-pressed={state.bold}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`np-tool${state.italic ? " is-active" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-pressed={state.italic}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`np-tool${state.underline ? " is-active" : ""}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          aria-pressed={state.underline}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>

        <span className="np-toolbar-divider" />

        <button
          type="button"
          className={`np-tool${state.highlight ? " is-active" : ""}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          aria-pressed={state.highlight}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        <div className="np-color" ref={colorRef}>
          <button
            type="button"
            className="np-tool"
            onClick={() => setColorOpen((open) => !open)}
            aria-expanded={colorOpen}
            title="Text colour"
          >
            <Baseline className="h-4 w-4" style={{ color: state.color || undefined }} />
            <ChevronDown className="np-color-caret" />
          </button>

          {colorOpen && (
            <div className="np-color-menu" role="menu">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.label}
                  type="button"
                  role="menuitem"
                  title={color.label}
                  aria-label={color.label}
                  className={`np-swatch${
                    canonicalColor(state.color) === canonicalColor(color.value) ? " is-active" : ""
                  }${color.value ? "" : " np-swatch-default"}`}
                  style={color.value ? { backgroundColor: color.value } : undefined}
                  onClick={() => setColor(color.value)}
                />
              ))}
            </div>
          )}
        </div>

        <span className="np-shortcut-hint">
          <kbd>Alt</kbd>+<kbd>↑</kbd>/<kbd>↓</kbd> move · <kbd>Alt</kbd>+<kbd>Shift</kbd>+
          <kbd>↓</kbd> duplicate
        </span>
      </div>

      <EditorContent editor={editor} className="np-editor-surface" />
    </div>
  );
}

export default NoteEditor;
