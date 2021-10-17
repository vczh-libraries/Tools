# Ubuntu Development Environment

## Create

Assuming you want to create a desktop launcher icon at the desktop,
and clone all repos in `~/Desktop/vczh-libraries`,
open a command line and run:

```PlainText
mkdir vczh-libraries
pushd vczh-libraries
git clone git@github.com:vczh-libraries/Tools.git
popd
source ./vczh-libraries/Tools/Ubuntu/vl/init.sh
```

If ssh has not been properly setup with github,
you could also use `git clone https://github.com/vczh-libraries/Tools.git` instead.

You will be asked two questions:
- Enter the launcher display name (VL++ DevEnv):
  - Choose the display name of the desktop launcher.
- Enter the launcher file name without extension (vl):
  - Choose the file name of the desktop launcher.

Answers nothing means you are satisfied with the default answer.

Assuming all default answers are chosen,
`~/Desktop/vl.desktop` and `~/Desktop/vczh-libraries/load.sh` will be created.

Right click `vl.desktop` and select `Allow Launching`,
now the icon of the file is changed,
and the name changed from `vl.desktop` to `VL++ DevEnv`.

## Prepare

- Double click the desktop launcher.
- Use `vapt` to install necessary softwares.
- Use `vssh` to setup a connection to github.
- Use `vsync --fix` to clone all missing repos.
- Use `vgo u` to sync all remote branches.

## Start to work

- Double click the desktop launcher. Type `vhelp` to see all available commands.
- Use `vsync --master` to switch all branches to `master`.
- Use `vsync --1.0` to switch all branches to `release-1.0`.
