# Git notes

## Git commands

open pull request from branch

```
git checkout master
git checkout -b dev
```

keep origin/master sync with upstream/master

```
git checkout master
git fetch upstream
git reset --hard upstream/master
git push -f origin master
```

sync with master

```
git checkout dev
git rebase master
```

revert untracked files

```
git reset
git checkout -- .
git clean -xdf
```

## gdb/cgdb

gdb --args ./Bin.exe args ...

`r/c`: run/continue to breakpoint or end
`n`: step next line,
`s`: step in
`finish`: step out

`b file:line`: set break-point
`c file:line`: reset break-point
`enable number ...`: enable break-points
`disable number ...`: disable break-oints
`d number ...`: delete break-points
`i b`: list all break points

`bt`: list callstacks
`f/up/down number`: inspect a function
`p name[.field]`: print a variable
`i locals/args`: print variables
`set print pretty on/off`: print full variable content

## cdb

installing as of Jan 2026:
- Install VS2022 or VS2026, jumps to `Individual Components` in setup and ensure `Windows Driver Kit`
- Install the real `Windows Driver Kit` [Download the Windows Driver Kit (WDK)]([Download the Windows Driver Kit (WDK)](https://learn.microsoft.com/en-us/windows-hardware/drivers/download-the-wdk))
- Use `C:\Program Files (x86)\Windows Kits\10\Debuggers\x64\cdb.exe`, you can make an environment variable

`cdb -c "commands" -o ./Bin.exe args ...` to start a process and pause, and then execute commands
or `& $env:CDBPATH ...` (need to create the variable manually)

`g`: run/continue to breakpoint or end
`q`: exit

`dv [/t] [name]`: print variables
`dt [-o] -r0 name`: print variable content one level of fields

## cdb remote debugging

`& $env:CDBPATH -server npipe:pipe=VlppUnitTest ...`: start a server
`& $env:CDBPATH -remote npipe:server=.,pipe=VlppUnitTest`: start a client

If you want to start a client, execute some commands, and quit and keep server alive:
```
".cls`r`nmultiple-lines-of-commands`r`n.remote_exit" | Out-File -Encoding ASCII -FilePath VlppCdbInput.txt; & $env:CDBPATH -remote npipe:server=.,pipe=VlppUnitTest -cf VlppCdbInput.txt | Tee-Object -FilePath VlppCdbOutput.txt; del VlppCdbInput.txt
```
Open VlppCdbOutput.txt and search for the last line with this pattern: `xxx> .cls`
everyting after that is the new output

## cdb Break-points

`lm`: list modules, `UnitTest.exe` will be `UnitTest`
`bl/.bpcmds`: list break-points
`be number ...`: enable break-points
`bd number ...`: disable break-oints
`bc number ...`: delete break-points
`bsc number condition`: attach condition to a break point

set break point at file.cpp:line in UnitTest.exe using:
- bp `file.cpp:line`
- bp `UnitTest!file.cpp:line`
the target must be quoted using "`"

## cdb Stepping

`.lines`: load callstack filename and line
`l+t`: switch to source stepping mode, `l-t` cancels
`l+s`: print source line when stepping, `l-s` cancels

`kn`: list callstacks
`kn 5`: list callstacks limit to top 5
`.frame number`: inspect a function

`p`: step next line
`t`: step in
`pt`: step out

## cdb/dx Working with Vlpp data structures

https://learn.microsoft.com/en-us/windows-hardware/drivers/debuggercmds/dx--display-visualizer-variables-

`dx var`: print variable, `var` could be any valid C expression
if `var` is a struct, offsets, fields and field types will be listed
`as name (var)` to define an alias, parentheses is necessary, use it later by `${name}`

### Using Vlpp.natvis
.nvload "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Packages\Debugger\Visualizers\vlpp.natvis"
after running the command, `dx` will use `Vlpp.natvis` to format the output, use `dx var,!` to print raw data

### `Ptr<T>`
`dx var.reference`

### `Nullable<T>`
`dx var.object`, only valid when `dx.initialized` is true
`dx var.initialized?var.object:nullptr` could do it in one command, always use `var.object` alone when you know it is initialized

### `Variable<A, B, C>`
`dx var.index` to know the actualy type, 0,1,2,... means A,B,C,...
`dx (Type*)var.buffer` to interpret `var` strong typed

### `ObjectString<wchar_t>` or other string:
`dx var.buffer+var.start`
when it is not null terminated `*(wchar_t(*)[10])(var.buffer+var.start)`
length is the value in  `dx var.length` but do not put the expression directly

### Containers that inherits from `ListBase<T>` (e.g. `Array<T>`, `List<T>`, `SortedList<T>`)
`dx var.buffer,[var.count]` to list all items
`dx var.buffer[var.count]` to inspect a specific item

### `Dictionary<K, V>` or `Group<K, V>`, keys and values are stored separately in fields.