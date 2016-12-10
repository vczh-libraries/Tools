#!/bin/bash

export PATH=${PWD}/vl/ControlPanel:${PATH}

function vssh {
    source vssh "$@"
}
export -f vssh

function GetFile {
    if ! [ -a $1 ]; then
        curl -H "Cache-Control: no-cache" -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/$1
    fi
}

function GetScript {
    local VFOLDER=$1
    shift
    local VPREFIX=$1
    shift
    local VITEMS=("${@}")

    if ! [ -d $VFOLDER ]; then
        mkdir $VFOLDER
    fi
    cd ./$VFOLDER

    for i in "${VITEMS[@]}"; do
        local VFILE="v${i}"
        local VURL="https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/${VPREFIX}-${i}.sh"
        if ! [ -a $VFILE ]; then
            curl -H "Cache-Control: no-cache" -o "${VFILE}" "${VURL}"
            chmod u+x $VFILE
        fi
    done
    
    cd ..
}

cd ./vl

    GetScript ControlPanel vl help ssh apt enlist
    GetScript Enlistment vle help go util_CppFromVcxproj util_CppDependencies

    GetFile vl-start-enlistment.sh
    chmod u+x vl-start-enlistment.sh

    GetFile vle-template.desktop

cd ..

unset -f GetFile
unset -f GetScript

echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vhelp for help information."
