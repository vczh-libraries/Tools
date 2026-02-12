const MESSAGE_BLOCK_FIELD = "__copilotMessageBlock";

export class MessageBlock {
    #blockType;
    #completed = false;
    #collapsed = false;
    #divElement;
    #headerElement;
    #bodyElement;

    constructor(blockType) {
        this.#blockType = blockType;
        this.#completed = false;
        this.#collapsed = false;

        this.#divElement = document.createElement("div");
        this.#divElement.classList.add("message-block", "receiving");
        this.#divElement[MESSAGE_BLOCK_FIELD] = this;

        this.#headerElement = document.createElement("div");
        this.#headerElement.classList.add("message-block-header");
        this.#headerElement.textContent = `${blockType} [receiving...]`;
        this.#divElement.appendChild(this.#headerElement);

        this.#bodyElement = document.createElement("div");
        this.#bodyElement.classList.add("message-block-body");
        this.#divElement.appendChild(this.#bodyElement);
    }

    appendData(data) {
        this.#bodyElement.textContent += data;
        // Auto-scroll to bottom while receiving
        this.#bodyElement.scrollTop = this.#bodyElement.scrollHeight;
    }

    complete() {
        this.#completed = true;
        this.#collapsed = false;
        this.#headerElement.textContent = this.#blockType;
        this.#headerElement.classList.add("completed");
        this.#divElement.classList.remove("receiving");
        this.#divElement.classList.add("completed");

        // "User" and "Message" blocks expand, others collapse
        const shouldExpand = this.#blockType === "User" || this.#blockType === "Message";
        if (shouldExpand) {
            // Collapse all other completed blocks, then expand this one
            const parent = this.#divElement.parentElement;
            if (parent) {
                for (const child of parent.children) {
                    const other = child[MESSAGE_BLOCK_FIELD];
                    if (other && other !== this && other.isCompleted) {
                        other.#collapsed = true;
                        other.#divElement.classList.add("collapsed");
                    }
                }
            }
            this.#collapsed = false;
            this.#divElement.classList.remove("collapsed");
        } else {
            // Reasoning/Tool blocks just collapse themselves
            this.#collapsed = true;
            this.#divElement.classList.add("collapsed");
        }

        this.#headerElement.onclick = () => {
            if (!this.#completed) return;
            this.#collapsed = !this.#collapsed;
            if (this.#collapsed) {
                this.#divElement.classList.add("collapsed");
            } else {
                this.#divElement.classList.remove("collapsed");
            }
        };
    }

    get isCompleted() {
        return this.#completed;
    }

    get divElement() {
        return this.#divElement;
    }
}

export function getMessageBlock(div) {
    return div?.[MESSAGE_BLOCK_FIELD];
}
