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
