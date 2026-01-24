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

cdb -o ./Bin.exe args ...

`g`: run/continue to breakpoint or end

`.lines`: load callstack filename and line
`kn`: list callstacks
`.frame number`: inspect a function
`dv [/t] [name]`: print variables
`dt [-o] -r0 name`: print variable content one level of fields
