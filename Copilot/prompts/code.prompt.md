# Task

## Goal and Constraints

- You must ensure the source code compiles.
- You must ensure all tests pass.

## Step 1. Implement Request

- Follow the chat message to implement the task.

## Step 2. Compile

- Check out `Compile the Solution` for details about compiling the solution but DO NOT run unit test yet.
  - `Compile the Solution` is the only way to build the project. DO NOT call any other tools or scripts.
- Find out if there is any warning or error.
  - `Compile the Solution` has the instruction about how to check compile result.
- If there is any compilation error, address all of them:
  - If there is any compile warning, only fix warnings that caused by your code change. Do no fix any other warnings.
  - If there is any compile error, you need to carefully identify, is the issue in the callee side or the caller side. Check out similar code before making a decision.
  - Go back to `Step 2. Compile`

## Step 3. Run Unit Test

- Check out `Executing Unit Test` for details about running unit test projects.
  - `Executing Unit Test` is the only way to run the unit test. DO NOT call any other tools or scripts.
- Run the unit test and see if they passed. If anything is good, you will only see test files and test cases that are executed.
  - Make sure added test cases are actually executed.
  - If any test case fails on a test assertion, the content of `TEST_ASSERT` or other macros will be printed to the output.
  - If any test case crashes, the failed test case will be the last one printed. In this case, you might need to add logging to the code.
    - In any test case, `TEST_PRINT` would help.
    - In other source code, `vl::console::Console::WriteLine` would help. In `Vlpp` project, you should `#include` `Console.h`. In other projects, the `Console` class should just be available.
    - When added logging are not longer necessary, you should remove all of them.

## Step 4. Fix Failed Test Cases

- If there are failed test cases, fix the code to make it work.
  - If your change did not change the test result, make sure you followed `Step 2. Compile` to compile the code.
  - If the test result still not changed after redoing `Step 2. Compile` and `Step 3. Run Unit Test`, these two steps are absolutely no problem, the only reason is that your change is not correct.
- You must carefully identify, if the cause is in the source code or in the failed test. In most of the cases, the cause is in the source code.
- DO NOT delete any test case.

## Step 5. Check it Again

- Go back to `Step 2. Compile`, follow all instructions and all steps again.
