#!/bin/bash

cd vl
export VPATH_CONTROL=${PWD}
export PATH=${VPATH_CONTROL}:${PATH}

function get-script {
    if ! [ -a $1 ]; then
        curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/$1
        chmod u+x $1
    fi
}
get-script vl-help.sh
get-script vl-ssh.sh
get-script vl-apt.sh
get-script vl-enlist.sh
unset -f get-script

cd ..
echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vl-help.sh for help information."
