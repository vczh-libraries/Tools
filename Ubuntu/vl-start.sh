#!/bin/bash

cd vl
export VPATH_CONTROL=${PWD}
export PATH=${VPATH_CONTROL}:${PATH}

function GetFile {
    if ! [ -a $1 ]; then
        curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/$1
    fi
}

function GetScript {
    GetFile "$1"
    chmod u+x $1
}
GetScript vl-help.sh
GetScript vl-ssh.sh
GetScript vl-apt.sh
GetScript vl-enlist.sh
GetScript vl-start-enlistment.sh
GetFile vle-template.desktop
unset -f GetScript

cd ..
echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vl-help.sh for help information."
