#!/bin/bash

export PATH=${PWD}/vl/ControlPanel:${PATH}

function GetFile {
    if ! [ -a $1 ]; then
        curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/$1
    fi
}

function GetScript {
    GetFile "$1"
    chmod u+x $1
}

cd ./vl

    mkdir ControlPanel
    pushd ./ControlPanel
        GetScript vl-help.sh
        GetScript vl-ssh.sh
        GetScript vl-apt.sh
        GetScript vl-enlist.sh
    popd

    mkdir Enlistment
    pushd ./Enlistment
    popd

    GetScript vl-start-enlistment.sh
    GetFile vle-template.desktop

popd

unset -f GetScript

echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vl-help.sh for help information."
