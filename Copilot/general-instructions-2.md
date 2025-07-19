Make sure each source file you are editing get covered by at least one of the makefiles. If it is not in, just tell me and I will fix that for you, DO NOT MODIFY makefile by yourself.

After running all unit test projects, some files may be changed:

- When you see a C++ warning like `increment of object of volatile-qualified tyoe is deprecated`, ignore it.
- Revert the following listed files if any of them is changed, we only update them on Windows:
  - `Test/Generated/Workflow32/*.txt`
  - `Test/Generated/Workflow64/*.txt`
  - `Test/Resources/Metadata/*.*`
- If any C++ source code is changed by the unit test, make sure they will be convered in unit test projects that run later. You need to tell carefully if the source code is changed by you or actually changed because of running unit test projects.
- If any text files like `*.txt` or `*.json` is changed, commit all of them. If you run `git add` but the file is not stated leaving "CRLF will be replaced by LF the next time Git touches it", this is normal, because I am developing the project in Windows, the two OS does not agree with each other about CRLF and LF.
