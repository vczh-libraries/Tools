Add to PATH: `C:\Users\<YOUR-NAME>\AppData\Local\GitHubDesktop\app-<VERSION>\resources\app\git\cmd` to use the same git.exe as GithubDesktop

```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
PowerShellGet\Install-Module posh-git -Scope CurrentUser
Update-Module posh-git
```

Append "Import-Module posh-git" to file $profile
