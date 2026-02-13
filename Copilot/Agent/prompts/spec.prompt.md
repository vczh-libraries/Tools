# Spec.md Driven Development

The root of this project "REPO-ROOT/Copilot/Agent" is not the workspace root,
you need to cd/pushd to this folder first before doing any development or testing.

When this file is tagged:
- Read the latest commit affecting any of the following folders, it is the anchor commit:
  - REPO-ROOT/Copilot/Agent/packages/CopilotPortal
  - REPO-ROOT/Copilot/Agent/packages/CopilotApi
- All commits with title "Update Spec.md" that newer than the anchor commit are new changes.
  - These commits update REPO-ROOT/Copilot/Agent/prompts/spec/Spec.md.
  - The Spec.md file defines how CopilotPortal should work.
  - To identify the new changes added to Spec.md:
    1. Navigate to REPO-ROOT/Copilot/Agent/prompts
    2. Delete all files in the snapshot folder: `rm -rf snapshot/*`
    3. Copy all files from spec to snapshot: `cp -r spec/* snapshot/`
    4. Use git diff to see what changed: `git diff --no-index snapshot/Spec.md spec/Spec.md`
    5. The diff output shows exactly what specifications have been added or modified
- Implement all new changes.

REPO-ROOT/Copilot/Agent is a yarn enabled project working with nodejs.
The CopilotPortal package serves a website and a RESTful API that can be tested with playwright chromium.

## Post Implementation

Remember to update REPO-ROOT/Copilot/Agent/README.md to describe:
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

## RESTful API Testing

When RESTful API implementation is changed,
you are recommended to start the server and test the API directly first.
Walk through all APIs.
Pay attention to the working directory argument in the API, you can use the REPO-ROOT of this project.
It starts a copilot session so it could be hard to predict what the response will be, just make some random conversation without making any side effect to the project.

## Playwright Testing

When the website is changed, you must always try all webpage features described in Spec.md.
