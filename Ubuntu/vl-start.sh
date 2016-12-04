#!/bin/bash

cd vl
export VPATH_CONTROL=${PWD}
export PATH=${VPATH_CONTROL}:${PATH}

function GetScript {
    if ! [ -a $1 ]; then
        curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/$1
        chmod u+x $1
    fi
}
GetScript vl-help.sh
GetScript vl-ssh.sh
GetScript vl-apt.sh
GetScript vl-enlist.sh
unset -f GetScript

cd ..
echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vl-help.sh for help information."
