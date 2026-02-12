# Spec.md Driven Development

When this file is tagged:
- Read the latest commit the following folders, it is the anchor commit:
  - REPO-ROOT/Copilot/Agent/packages/CopilotPortal/src
  - REPO-ROOT/Copilot/Agent/packages/CopilotPortal/assets
- All commits with title "Update Spec.md" that newer than the anchor commit are new changes.
  - These commits updates REPO-ROOT/Copilot/Agent/packages/CopilotPortal/Spec.md.
  - The Spec.md file defines how CopilotPortal should work.
- Implement all new changes.

REPO-ROOT/Copilot/Agent is a yarn enabled project working with nodejs.
The CopilotPortal package serves a website and a RESTful API that can be tested with playwright chromium.