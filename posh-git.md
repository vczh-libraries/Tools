# Git notes

## Install posh-git

Add to PATH: `C:\Users\<YOUR-NAME>\AppData\Local\GitHubDesktop\app-<VERSION>\resources\app\git\cmd` to use the same git.exe as GithubDesktop

```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
PowerShellGet\Install-Module posh-git -Scope CurrentUser
Update-Module posh-git
```

Append "Import-Module posh-git" to file $profile

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
git clean -d -f
```
## gdb/cgdb

gdb --args ./Bin.exe args ...

`r/c`: run/continue to breakpoint or end
`s`: step in
`n`: step out

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

`cdb -o ./Bin.exe args ...`
or `& $env:CDBPATH ...` (need to create the variable manually)

`g`: run/continue to breakpoint or end
`q`: exit

`.lines`: load callstack filename and line
`kn`: list callstacks
`.frame number`: inspect a function
`dv [/t] [name]`: print variables
`dt [-o] -r0 name`: print variable content one level of fields

## cdb/dx with Vlpp data structures

`dx var`: print variable, `var` could be any valid C expression
if `var` is a struct, offsets, fields and field types will be listed
`as name (var)` to define an alias, parentheses is necessary, use it later by `${name}`

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