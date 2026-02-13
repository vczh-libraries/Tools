# Specification

Root folder of the project is `REPO-ROOT/Copilot/Agent`.
Read `README.md` to understand the whole picture of the project as well as specification organizations.

## Related Files

- `assets`
  - `messageBlock.css`
  - `messageBlock.js`

### messageBlock.css

Put messageBlock.js specific css file in messageBlock.css.

### messageBlock.js

It exposes some APIs in this schema

```typescript
export class MessageBlock {
  constructor(blockType: "User" | "Reasoning" | "Tool" | "Message");
  appendData(data: string): void;
  complete(): void;
  get isCompleted(): boolean;
  get divElement(): HTMLDivElement;
  get title(): string;
  set title(value: string);
}

export function getMessageBlock(div: HTMLDivElement): MessageBlock | undefined;
```

Each `MessageBlock` has a title, displaying: "blockType (title) [receiving...]" or "blockType (title)".
When `title` is empty, "()" and the space before it must be omitted.
Receiving appears when it is not completed yet.

When a `MessageBlock` is created and receiving data, the height is limited to 150px, clicking the header does nothing

When a `MessageBlock` is completed:
- If this `MessageBlock` is "User" and "Message", it will expand, otherwise collapse.
- Completing a `MessageBlock` should not automatically expand or collapse other blocks.
- Clicking the header of a completed `MessageBlock` switch between expanding or collapsing.
- There is no more height limit, it should expands to render all data.
- A button appears at the very right of the header, it should fills full height.
  - When the content is rendering as markdown, it shows "View Raw Data", clicking it shows the raw data.
  - When the content is raw data, it shows "View Markdown", clicking it shows the markdown rendering of the raw data.

Before a `MessageBlock` is completed, raw data should render.
After it is completed, assuming the data is markdown document and render it properly:
- Except for "Tool" block, and "Tool" block should not render the button switching between raw data and markdown.
- Try to tell if the raw content is markdown or just ordinary text, if it doesn't look like a markdown, do not do the markdown rendering automatically.

Inside the `MessageBlock`, it holds a `<div/>` to change the rendering.
And it should also put itself in the element (e.g. in a field with a unique name) so that the object will not be garbage-collected.
