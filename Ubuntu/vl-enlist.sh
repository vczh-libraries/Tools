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
            exit 1
        fi
        local VFILE=${VCPROOT}/vle_${i}.desktop
        if ! [ -a ${VFILE} ]; then
            echo "Creating ${VFILE} ..."
            break
        fi
    done

    local VNAME_USER=""
    local VNAME="Enlistment (${PWD})"
    echo "Enter the display name (${VNAME}):"
    read VNAME_USER
    if ! [ "${VNAME_USER}" == "" ]; then
        VNAME=${VNAME_USER}
    fi
    local VPATH=${PWD}

    local VTEMPLATE=${VCPROOT}/vl/vle-template.desktop
    local VPATTERNS="s?<NAME>?${VNAME}?g;"$'\n'"s?<PATH>?${VPATH}?g;"$'\n'"s?<VCPROOT>?${VCPROOT}?g;"
    sed -e "${VPATTERNS}" "${VTEMPLATE}" > "${VFILE}"
    chmod u+x "${VFILE}"
}

function Enlist {
    if [ ${PWD} == ${VCPROOT} ]; then
        echo "Repos cannot be enlisted in the folder for *.desktop files."
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
