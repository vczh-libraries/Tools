#!/bin/bash

cd vl
export VPATH_CONTROL=${PWD}
export PATH=${VPATH_CONTROL}:${PATH}

if ! [ -a vl-ssh.sh ]; then
    curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-ssh.sh
    chmod u+x vl-ssh.sh
fi
if ! [ -a vl-apt.sh ]; then
    curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-apt.sh
    chmod u+x vl-apt.sh
fi
if ! [ -a vl-enlist.sh ]; then
    curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-enlist.sh
    chmod u+x vl-enlist.sh
fi

cd ..
echo Welcome to Vczh Libraries Control Panel!
