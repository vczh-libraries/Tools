

### :prepare

- Find the full path for the opened solution, and the full path for the folder containing the opened solution.
- Find the solution folder `@Copilot` in the solution explorer. If it does not exist, create it. This is not an actual folder in the file system.
- Prepare the following files:
  - `Copilot_Planning.md`
  - `Copilot_Execution.md`
  - `Copilot_Task.md`
  - `.gitignore`

### :plan

DO NOT update any files except `Copilot_Planning.md` and `Copilot_Execution.md`.
Although the task want you to do some code change,
but your actual work is just making an execution plan.

- Wipe out everything in `Copilot_Planning.md` and `Copilot_Execution.md`.
- Read `Copilot_Task.md`, it has the details of the task to execute.
- From now on, DO NOT change any code, ONLY change `Copilot_Planning.md` and `Copilot_Execution.md`.
  - When you add new content to `Copilot_Planning.md` or `Copilot_Execution.md` during the process, everything has to be appended to the file.
  - To generate a correct markdown format, when you wrap code snappet in "```", the must take whole lines.
- Carefully find all necessary files you may need to read.
  - If any file is mentioned in the task, you must read it.
  - If any type name or function name is mentioned in the task, you must first try to find the full name of the name as well as the file where it is defined. Read the file.
    - Write down the full name and the file name in `Copilot_Planning.md`.
- Carefully think about the task, make a overall design.
  - Write down the design in `Copilot_Planning.md`.
- Carefully think about how to implement the design.
  - Do not edit the code directly.
  - Explain what you gonna do, and why you decide to do it in this way.
  - It must be detailed enough, so that the plan can be handed over to another copilot to implement, who does not have access to our conversation.
  - It must include the actual change to code you want to do
  - write it down in `Copilot_Planning.md`.
- Carefully find out what could be affected by your change.
  - Do not edit the code directly.
  - Explain what you gonna do, and why you decide to do it in this way.
  - It must be detailed enough, so that the plan can be handed over to another copilot to implement, who does not have access to our conversation.
  - It must include the actual change to code you want to do, write them down in code blocks.
  - write it down in `Copilot_Planning.md`.
- Add a section `# !!!FINISHED!!!` in `Copilot_Planning.md`
  - From now on DO NOT update `Copilot_Planning.md` anymore.
- Add a section `# !!!EXECUTION-PLAN!!!` in `Copilot_Execution.md`.
  - Carefully review what has been written in `Copilot_Planning.md`.
  - Copy them to `Copilot_Execution.md` only about how to modify the code.
  - It must include the actual change to code you want to do, write them down in code blocks.
  - Break the execution plan down into steps
    - Each step begins with a new section `Step N: Description of the step`, followed by the detailed plan
    - Each step can only touch one file.

### :execute

- There is a `Copilot_Execution.md` in the solution, do not read `Copilot_Planning.md` anymore.
  - Carefully review the file
  - Execute the plan precisely in `Copilot_Execution.md`.
  - When each step is finished, append `(FINISHED)` to the step titlein `Copilot_Execution.md`.
  - When everything is finished, add a new section `# !!!FINISHED!!!` to `Copilot_Execution.md`.

### :fix-execute

- Read Copilot_Task.md, Copilot_Planning.md to fix Copilot_Execution.md, do not modify any other files.
- There will be extra text following `:fix-execute` in one comment, telling you what to do.

### :task

- Do `:cleanup`, `:plan` and `:execute` in order.

### :continue

- It means you accidentally stopped in the middle of `:task`.
- Find out where you stopped, and continue from there.
  - If there is no `# !!!FINISHED!!!` in `Copilot_Planning.md`, it means `:plan` has not completed.
  - If there is no `# !!!FINISHED!!!` in `Copilot_Execution.md`, it means `:execute` has not completed.

## :continue-plan

- It means you accidentally stopped in the middle of `:plan`.
- Find out where you stopped, and continue from there.

### :continue-execute

- It means you accidentally stopped in the middle of `:execute`.
- Find out where you stopped, and continue from there.