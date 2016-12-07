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

function Go {
    local VPROJ="${VROOT}/$2"
    if ! [ -d $VPROJ ]; then
        echo "Folder \"${VPROJ}\" does not exist."
        return 1
    fi

    pushd $VPROJ > /dev/null
    local GITHEAD="$(git symbolic-ref HEAD 2>/dev/null)"
    if [ "${GITHEAD}" == "" ]; then
        echo "\"${VPROJ}\" is not a valid git repo."
        popd > /dev/null
        return 1
    fi

    local VPATH="${VPROJ}/$1"
    if ! [ -d $VPATH ]; then
        echo Fail "Folder \"${VPATH}\" does not exist."
        popd > /dev/null
        return 1
    fi

    popd > /dev/null
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

    s)
    Go "Source" $2
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
