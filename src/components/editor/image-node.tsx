import type {
	EditorConfig,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import type { JSX } from "react";

export type SerializedImageNode = Spread<
	{ alt: string; src: string },
	SerializedLexicalNode
>;

function ImageNodeView({ alt, src }: { alt: string; src: string }) {
	return (
		<img
			src={src}
			alt={alt}
			className="my-3 block max-w-full rounded-md border border-neutral-200"
		/>
	);
}

export class ImageNode extends DecoratorNode<JSX.Element> {
	__alt: string;
	__src: string;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__alt, node.__key);
	}

	constructor(src: string, alt: string, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__alt = alt;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		const span = document.createElement("span");
		span.className = "block";
		return span;
	}

	updateDOM(): false {
		return false;
	}

	decorate(): JSX.Element {
		return <ImageNodeView src={this.__src} alt={this.__alt} />;
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		return $createImageNode(serializedNode.src, serializedNode.alt);
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			alt: this.__alt,
			src: this.__src,
		};
	}

	isInline(): false {
		return false;
	}
}

export function $createImageNode(src: string, alt: string): ImageNode {
	return new ImageNode(src, alt);
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}
