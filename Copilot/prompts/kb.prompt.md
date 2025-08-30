# Update Knowledge Base

- Your goal is to update the knowledge base.
- If there is an `# Update` section in the LATEST chat message, it means you must update the knowledge base according to the work you have implemented in the document.
  - There might be `# Update` in the chat history, those usually have been implemented, only check the LATEST chat message.
  - I have not designed what to do, so please print a `# NOT IMPLEMENTED!` and stop immediately.
- If there is no title in the section, it means you must update the knowledge base according to the LATEST chat message.

## Implement the Knowledge Base

- Find out the `Accessing Knowledge Base` section. Understand the organization of the knowledge base.
- Read the `Index.md` of the knowledge base first.
- There could be multiple places as the request might include multiple objectives. For each objective:
  - Find out which project does it belong to.
  - Read through all categories, find out which category is the best fit.
    - If there is no obvious best answer, create a new category.A new category comes with a new guideline file, you must add it to the `KnowledgeBase` project.
    - Please be careful about the place to insert the new category, a new category should be added at the end of the belonging project.
  - Update the category description if you think there is anything worth menthioning.
  - Read through the file of the hyperlink in the category, update the content to reflect the change I want you to make.

## Adding or Updating an `API Explanation` guideline

- Content in such guideline must be compact. Do not repeat anything that could be read from the source code.
- Do not simply add code samples.
  - If you do, keep the code sample stick to only usage of APIs.
  - Do not add code sample just to show best practices or what it can do or what it is commonly used or something like that, describe these topics in words.
  - A code sample is only necessary when many functions or classes must be involved in a specific order. A good example would be the `TEST_FILE` structure.
