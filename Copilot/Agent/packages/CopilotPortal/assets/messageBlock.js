const MESSAGE_BLOCK_FIELD = "__copilotMessageBlock";

export class MessageBlock {
    #blockType;
    #completed = false;
    #collapsed = false;
    #rawData = "";
    #divElement;
    #headerElement;
    #bodyElement;

    constructor(blockType) {
        this.#blockType = blockType;
        this.#completed = false;
        this.#collapsed = false;
        this.#rawData = "";

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
        this.#rawData += data;
        this.#bodyElement.textContent = this.#rawData;
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

        // Render markdown for completed blocks (except Tool blocks)
        if (this.#blockType !== "Tool" && typeof marked !== "undefined") {
            this.#bodyElement.classList.add("markdown-rendered");
            this.#bodyElement.innerHTML = marked.parse(this.#rawData);
        }

        // "User" and "Message" blocks expand, others collapse
        // Completing a block should NOT automatically expand or collapse other blocks
        const shouldExpand = this.#blockType === "User" || this.#blockType === "Message";
        if (shouldExpand) {
            this.#collapsed = false;
            this.#divElement.classList.remove("collapsed");
        } else {
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
