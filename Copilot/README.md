# Using Powershell Scripts (run in other repo)

- copilotInit.ps1: Initialize copilot environment.
- copilotCopyPrompt.ps1 <PROJECT>: When prompt files are changed, only sync prompt files.
- copilotCopyResource.ps1 <PROJECT>: When knowledge base or scripts is changed, only sync knowledge base or scripts. Process of the working task will be lost.
- copilotUpdateKB.ps1: When local knowledge base is changed, sync back to this repo.
