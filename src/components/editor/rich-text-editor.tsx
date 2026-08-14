import { LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
	INSERT_ORDERED_LIST_COMMAND,
	INSERT_UNORDERED_LIST_COMMAND,
	ListItemNode,
	ListNode,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $createHeadingNode, HeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
	$createParagraphNode,
	$getSelection,
	$isRangeSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	type EditorState,
	FORMAT_TEXT_COMMAND,
	REDO_COMMAND,
	UNDO_COMMAND,
} from "lexical";
import {
	Bold,
	Italic,
	Link2,
	List,
	ListOrdered,
	Redo2,
	Underline,
	Undo2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
	emptyLexicalStateString,
	extractTextFromLexicalState,
} from "#/lib/lexical";

const editorTheme = {
	heading: {
		h1: "mb-2 text-2xl font-bold",
		h2: "mb-2 text-xl font-semibold",
		h3: "mb-2 text-lg font-semibold",
	},
	list: {
		ul: "mb-3 list-disc pl-6",
		ol: "mb-3 list-decimal pl-6",
	},
	paragraph: "mb-3",
	link: "text-blue-600 underline",
	text: {
		bold: "font-semibold",
		italic: "italic",
		underline: "underline",
	},
};

type RichTextEditorProps = {
	initialBody: string;
	onChange: (bodyJson: string, plainText: string) => void;
};

const btnClass =
	"rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40";

export function RichTextEditor({ initialBody, onChange }: RichTextEditorProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const initialConfig = useMemo(
		() => ({
			namespace: "ArticleEditor",
			theme: editorTheme,
			nodes: [LinkNode, ListNode, ListItemNode, HeadingNode],
			editorState: initialBody || emptyLexicalStateString,
			onError: (error: Error) => {
				console.error(error);
			},
		}),
		[initialBody],
	);

	if (!mounted) {
		return (
			<div className="min-h-[300px] rounded-md border border-neutral-300 bg-white p-4 text-sm text-neutral-400">
				Loading editor…
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-md border border-neutral-300 bg-white">
			<LexicalComposer initialConfig={initialConfig}>
				<Toolbar />
				<div className="border-t border-neutral-200">
					<RichTextPlugin
						contentEditable={
							<ContentEditable className="min-h-[300px] px-4 py-3 outline-none" />
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<ListPlugin />
					<LinkPlugin />
					<OnChangePlugin
						onChange={(editorState: EditorState) => {
							const serialized = JSON.stringify(editorState.toJSON());
							onChange(serialized, extractTextFromLexicalState(serialized));
						}}
					/>
				</div>
			</LexicalComposer>
		</div>
	);
}

function Toolbar() {
	const [editor] = useLexicalComposerContext();
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);

	useEffect(() => {
		const unregisters = [
			editor.registerCommand(
				CAN_UNDO_COMMAND,
				(payload: boolean) => {
					setCanUndo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
			editor.registerCommand(
				CAN_REDO_COMMAND,
				(payload: boolean) => {
					setCanRedo(payload);
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		];

		editor.dispatchCommand(CAN_UNDO_COMMAND, false);
		editor.dispatchCommand(CAN_REDO_COMMAND, false);

		return () => {
			for (const unregister of unregisters) {
				unregister();
			}
		};
	}, [editor]);

	const formatText = (type: "bold" | "italic" | "underline") => {
		editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
	};

	const formatBlock = (level: "p" | "h1" | "h2" | "h3") => {
		editor.update(() => {
			const selection = $getSelection();

			if (!$isRangeSelection(selection)) {
				return;
			}

			if (level === "p") {
				$setBlocksType(selection, () => $createParagraphNode());
			} else {
				$setBlocksType(selection, () => $createHeadingNode(level));
			}
		});
	};

	const toggleLink = () => {
		const url = window.prompt("Enter a link URL (e.g. https://…).");

		if (url?.trim()) {
			editor.dispatchCommand(TOGGLE_LINK_COMMAND, url.trim());
		}
	};

	return (
		<div className="flex flex-wrap items-center gap-1 px-3 py-2">
			<select
				onChange={(event) =>
					formatBlock(event.target.value as "p" | "h1" | "h2" | "h3")
				}
				defaultValue="p"
				className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm"
			>
				<option value="p">Paragraph</option>
				<option value="h1">Heading 1</option>
				<option value="h2">Heading 2</option>
				<option value="h3">Heading 3</option>
			</select>

			<span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden />

			<button
				type="button"
				title="Bold"
				aria-label="Bold"
				onClick={() => formatText("bold")}
				className={btnClass}
			>
				<Bold className="size-4" />
			</button>
			<button
				type="button"
				title="Italic"
				aria-label="Italic"
				onClick={() => formatText("italic")}
				className={btnClass}
			>
				<Italic className="size-4" />
			</button>
			<button
				type="button"
				title="Underline"
				aria-label="Underline"
				onClick={() => formatText("underline")}
				className={btnClass}
			>
				<Underline className="size-4" />
			</button>
			<button
				type="button"
				title="Insert link"
				aria-label="Insert link"
				onClick={toggleLink}
				className={btnClass}
			>
				<Link2 className="size-4" />
			</button>

			<span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden />

			<button
				type="button"
				title="Bulleted list"
				aria-label="Bulleted list"
				onClick={() =>
					editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
				}
				className={btnClass}
			>
				<List className="size-4" />
			</button>
			<button
				type="button"
				title="Numbered list"
				aria-label="Numbered list"
				onClick={() =>
					editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
				}
				className={btnClass}
			>
				<ListOrdered className="size-4" />
			</button>

			<span className="mx-1 h-5 w-px bg-neutral-200" aria-hidden />

			<button
				type="button"
				title="Undo"
				aria-label="Undo"
				disabled={!canUndo}
				onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
				className={btnClass}
			>
				<Undo2 className="size-4" />
			</button>
			<button
				type="button"
				title="Redo"
				aria-label="Redo"
				disabled={!canRedo}
				onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
				className={btnClass}
			>
				<Redo2 className="size-4" />
			</button>
		</div>
	);
}
