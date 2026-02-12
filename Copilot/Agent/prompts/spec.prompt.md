# Spec.md Driven Development

When this file is tagged:
- Read the latest commit affecting any of the following folders, it is the anchor commit:
  - REPO-ROOT/Copilot/Agent/packages/CopilotPortal/src
  - REPO-ROOT/Copilot/Agent/packages/CopilotPortal/assets
- All commits with title "Update Spec.md" that newer than the anchor commit are new changes.
  - These commits updates REPO-ROOT/Copilot/Agent/packages/CopilotPortal/Spec.md.
  - The Spec.md file defines how CopilotPortal should work.
- Implement all new changes.

REPO-ROOT/Copilot/Agent is a yarn enabled project working with nodejs.
The CopilotPortal package serves a website and a RESTful API that can be tested with playwright chromium.

## Post Implementation

When you think you have implemented all changes and all tests including playwright and unit test pass,
git commit the change with title "Updated Copilot/Agent" but do not git push.

## RESTful API Testing

When RESTful API implementation is changed,
you are recommended to start the server and test the API directly first.
Walk through all APIs.
Pay attention to the working directory argument in the API, you can use the REPO-ROOT of this project.
It starts a copilot session so it could be hard to predict what the response will be, just make some random conversation without making any side effect to the project.

## Playwright Testing

When the website is changed, you must always try all webpage features described in Spec.md
