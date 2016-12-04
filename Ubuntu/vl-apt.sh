#!/bin/bash

function Help {
    echo "Usage:"
    echo "--install"
    echo "    Install all required softwares for Vczh Libraries development:"
    echo "--remove"
    echo "    Remove all required softwares"
}

function AptGet-Install {
    echo "Installing $1 ..."
    sudo apt-get install "$1" --assume-yes > /dev/null
}

function AptGet-Remove {
    echo "Removing $1 ..."
    sudo apt-get remove "$1" --assume-yes > /dev/null
}

function AptGet-AutoRemove {
    echo "Removing unnecessary dependencies ..."
    sudo apt-get autoremove --assume-yes > /dev/null
}

function Install {
    AptGet-Install htop
    AptGet-Install cgdb
    AptGet-Install manpages-posix-dev
    AptGet-Install git
    AptGet-Install apt-file
    AptGet-Install clang
    AptGet-Install openssh-server
    AptGet-Install lconv
    
    echo "Starting ssh service ..."
    /etc/init.d/ssh start
}

function Remove {
    echo "Stopping ssh service ..."
    /etc/init.d/ssh stop

    AptGet-Remove htop
    AptGet-Remove cgdb
    AptGet-Remove manpages-posix-dev
    AptGet-Remove git
    AptGet-Remove apt-file
    AptGet-Remove clang
    AptGet-Remove openssh-server
    AptGet-Remove lconv

    AptGet-AutoRemove
}

case $1 in
    --help)
    Help
    ;;

    --install)
    Add
    ;;

    --remove)
    Submit
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
