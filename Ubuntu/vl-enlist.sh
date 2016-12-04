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
    echo "Creating desktop entry for ${PWD} ..."
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
