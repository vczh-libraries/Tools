# Leveraging the Knowledge Base

When making design or coding decisions, you must leverage the knowledge base to make the best choice.
The main entry is `Index.md`. Find out `Accessing the Knowledge Base` about how to access the knowledge base.

`Index.md` is organized in this way:

- `## Guidance`: A general guidance that play a super important part repo-wide.
- Each `## Project`: A brief description of each project and its purpose.
  - `### Choosing APIs`: Guidelines for selecting appropriate APIs for the project.
  - `### Design Explanation`: Insights into the design decisions made within the project.
- `## Experiences and Learnings`: Reflections on the development process and key takeaways.

## Project/Choosing APIs

There are multiple categories under `Choosing APIs`. Each category begins with a short and accurate title `#### Category`.
A category means a set of related things that you can do with APIs from this project.

Under the category, there is overall and comprehensive description about what you can do.

Under the description, there are bullet points and each item follow the format:  `- Use CLASS-NAME for blahblahblah` (If a function does not belong to a class, you can generate `Use FUNCTION-NAME ...`).
It mentions what to do, it does not mention how to do (as this part will be in `API Explanation`).
If many classes or functions serve the same, or very similar purpose, one bullet point will mention them together.

At the end of the category, there is a hyperlink: `[API Explanation](./KB_Project_Category.md)` (no space between file name, all pascal case).

## Project/Design Explanation

There are multiple topics under `Design Explanation`. Each topic begins with a short and accurate title `#### Topic`.
A topic means a feature of this project, it will be multiple components combined.

Under the topic, there is overall and comprehensive description about what does this feature do.

Under the description, there are bullet points to provide a little more detail, but do not make it too long. Full details are supposed to be in the document from the hyperlink.

At the end of the topic, there is a hyperlink: `[Design Explanation](./KB_Project_Design_Topic.md)` (no space between file name, all pascal case).

## Experiences and Learnings

(To do ...)

## Accessing the Knowledge Base

If you are running in Visual Studio, you will find the `KnowledgeBase` project in the current solution.
Otherwise, locate the `KnowledgeBase` project in `REPO-ROOT/.github/KnowledgeBase/KnowledgeBase.vcxitems`.
`REPO-ROOT` is the root folder of the repo.

`KnowledgeBase.vcxitems` is a Visual Studio project file, it is used as a list of all document files in the knowledge base.
In case when a new file is added to the knowledge base, `KnowledgeBase.vcxitems` must be updated to contain that file.

The entry point is its `Index.md` file. You need to locate it in `KnowledgeBase.vcxitems`.
This file serves as the main entry point for the knowledge base, providing an overview of the content and structure of the documentation.
