# Spec Driven Development

The root of this project `REPO-ROOT/Copilot/Agent` is not the workspace root,
you need to cd/pushd to this folder before calling yarn and nodejs.
The CopilotPortal package serves a website and a RESTful API that can be tested with playwright chromium.
All folders and files mentioned in the instructions are in the `REPO-ROOT/Copilot/Agent` folder.

When this file is tagged, find out new changes in the spec:
- Delete all files in `prompts/snapshot`.
- Copy all files in `prompts/spec` to `prompts/snapshot`.
- You can see what has been changed in the spec by git diff.
- Implement all changes.

## Changing the Spec

You are allowed to change the spec although you do not have to.
When you think the spec needs to update,
You will have to change files in both `prompts/snapshot` and `prompts/spec`, keep them sync.

## RESTful API Testing

When RESTful API implementation is changed,
you are recommended to start the server and test the API directly first.
Walk through all APIs.
Pay attention to the working directory argument in the API, you can use the `REPO-ROOT` of this project.
It starts a copilot session so it could be hard to predict what the response will be, just make some random conversation without making any side effect to the project.

## Playwright Testing

When the website is changed, you must always try all webpage features described in the spec.

## Post Implementation

Remember to update `README.md` to describe:
- What this project is.
- What does it use.
- How to maintain and run the project.
- Brief description of the project structure.

### Git Push

This section only applies when you are running locally (aka not running in github.com maintaining a pull request).

When you think you have implemented all changes and all tests including playwright and unit test pass,
git commit the change with title "Updated Copilot/Agent" and git push.
Git push may fail when the remote branch has new commits:
- Do the merge when it could be automatically done. And then git push again.
- If there is any merge conflict, tell me and stop.
