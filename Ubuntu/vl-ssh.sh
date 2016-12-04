#!/bin/bash

case $1 in
    --help)
    echo "Usage:"
    echo "--add <email>"
    echo "    Create a new rsa key (~/.ssh/id_rsa_vl)"
    echo "--submit"
    echo "    Submit the created key to your github account"
    echo "--remove"
    echo "    Remove the created key"
    ;;

    --add)
    if [ -a ~/.ssh/id_rsa_vl ]; then
        echo "Key (~/.ssh/id_rsa_vl) has already been created."
    else
        ssh-keygen -t rsa -b 4096 -C "$2" -f ~/.ssh/id_rsa_vl
        eval "$(ssh-agent -s)"
        ssh-add ~/.ssh/id_rsa_vl
        ls ~/.ssh
    fi
    ;;

    --submit)
    if [ -a ~/.ssh/id_rsa_vl ]; then
        echo "--submit is under development"
    else
        echo "Key (~/.ssh/id_rsa_vl) does not exist."
    fi
    ;;

    --remove)
    if [ -a ~/.ssh/id_rsa_vl ]; then
        ssh-add -d ~/.ssh/id_rsa_vl
        rm ~/.ssh/id_rsa_vl
        rm ~/.ssh/id_rsa_vl.pub
        ls ~/.ssh
    else
        echo "Key (~/.ssh/id_rsa_vl) does not exist."
    fi
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
