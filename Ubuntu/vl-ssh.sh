#!/bin/bash

function Help {
    echo "Usage:"
    echo "--add <email>"
    echo "    Create a new rsa key (~/.ssh/id_rsa_vl)"
    echo "--submit"
    echo "    Submit the created key to your github account"
    echo "--verify"
    echo "    Verify ssh connection to github"
    echo "--remove"
    echo "    Remove the created key"
}

function Add {
    if [ -a ~/.ssh/id_rsa_vl ]; then
        echo "Key (~/.ssh/id_rsa_vl) has already been created."
    else
        ssh-keygen -t rsa -b 4096 -C "$1" -f ~/.ssh/id_rsa_vl
        eval "$(ssh-agent -s)"
        pushd ~/.ssh
        ssh-add id_rsa_vl
        popd
        echo "All files in ~/.ssh:"
        ls ~/.ssh
    fi
}

function Submit {
    if [ -a ~/.ssh/id_rsa_vl ]; then
        echo "Username:"
        read VUSERNAME
        echo "Password:"
        read -s VPASSWORD
        VTITLE="Vczh Libraries Control Panel - $(hostname)"
        VKEY=$(<~/.ssh/id_rsa_vl.pub)
        curl -u "${VUSERNAME}:${VPASSWORD}" --data '{"title":"'"${VTITLE}"'","key":"'"${VKEY}"'"}' https://api.github.com/user/keys
    else
        echo "Key (~/.ssh/id_rsa_vl) does not exist."
    fi
}

function Verify {
    ssh -T git@github.com
}

function Remove {
    if [ -a ~/.ssh/id_rsa_vl ]; then
        pushd ~/.ssh
        ssh-add -d id_rsa_vl
        popd
        rm ~/.ssh/id_rsa_vl
        rm ~/.ssh/id_rsa_vl.pub
        ls ~/.ssh
    else
        echo "Key (~/.ssh/id_rsa_vl) does not exist."
    fi
}

case $1 in
    --help)
    Help
    ;;

    --add)
    Add "$2"
    ;;

    --submit)
    Submit
    ;;

    --verify)
    Verify
    ;;

    --remove)
    Remove
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
