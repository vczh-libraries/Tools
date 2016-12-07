#!/bin/bash

function Help {
    echo "Usage:"
    echo "p <project>"
    echo "    Go to the root folder of this project."
    echo "t <project>"
    echo "    Go to the \"Test/Linux\" folder of this project."
    echo "s <project>"
    echo "    Go to the \"Source\" folder of this project"
}

function Fail {
    echo $1
    popd > /dev/null
    exit 1
}

function Go {
    local VPROJ="${VROOT}/$2"
    if ! [ -d $VPROJ ]; then
        echo "Folder \"${VPROJ}\" does not exist."
        exit 1
    fi

    pushd $VPROJ > /dev/null
    local GITHEAD="$(git symbolic-ref HEAD 2>/dev/null)"
    if [ "${GITHEAD}" == "" ]; then
        Fail "\"${VPROJ}\" is not a valid git repo."
    fi

    local VPATH="${VPROJ}/$1"
    if ! [ -d $VPATH ]; then
        Fail "Folder \"${VPATH}\" does not exist."
    fi

    popd > /dev/null
    echo $VPATH
    cd $VPATH
}

case $1 in
    --help)
    Help
    ;;

    p)
    Go "" $2
    ;;

    t)
    Go "Test/Linux" $2
    ;;

    t)
    Go "Source" $2
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
