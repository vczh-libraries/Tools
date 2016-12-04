#!/bin/bash

function Help {
    echo "Usage:"
    echo "--entry"
    echo "    Create a desktop shortcut for operating this enlistment. This should be done in --enlist."
    echo "--enlist"
    echo "    Enlist all repos in the current directory."
}

function GitClone {
    git clone git@github.com:vczh-libraries/${1}.git
}

function Entry {
    for i in `seq 1 101`; do
        if [ "$i" == "101" ]; then
            echo "You have too many enlistments!"
            pushd ~/Desktop
            ls *.desktop
            popd
            exit 1
        fi
        VFILE=~/Desktop/vle_${i}.desktop
        if ! [ -a ${VFILE} ]; then
            echo "Creating ${VFILE} ..."
            break
        fi
    done

    VNAME="Enlistment (${PWD})"
    echo "Enter the display name (${VNAME}):"
    read VNAME_USER
    if ! [ "${VNAME_USER}" == "" ]; then
        VNAME=VNAME_USER
    fi
    VPATH=${PWD}

    VTEMPLATE=~/Desktop/vl/vle-template.desktop
    VPATTERNS="s?<NAME>?${VNAME}?g;"$'\n'"s?<PATH>?${VPATH}?g;"
    sed -e "${VPATTERNS}" "${VTEMPLATE}" > "${VFILE}"
    chmod u+x "${VFILE}"
}

function Enlist {
    if [ ${PWD} == ~/Desktop ]; then
        echo "I don't think you want to enlist repos in your desktop folder."
        exit 1
    fi
    GitClone Tools
    GitClone Vlpp
    GitClone Workflow
    GitClone GacUI
    GitClone GacJS
    GitClone Release
    GitClone XGac
    GitClone iGac
    Entry
}

case $1 in
    --help)
    Help
    ;;

    --entry)
    Entry
    ;;

    --enlist)
    Enlist
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
