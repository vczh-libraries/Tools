#!/bin/bash

function Help {
    echo "Usage:"
    echo "--install"
    echo "    Install all required softwares for Vczh Libraries development:"
    echo "        htop"
    echo "        cgdb"
    echo "        manpages-posix-dev"
    echo "        git"
    echo "        apt-file"
    echo "        clang"
    echo "        openssh-server"
    echo "        lcov"
    echo "        vim"
    echo "--remove"
    echo "    Remove all required softwares"
}

function AptGetInstall {
    echo "Installing $1 ..."
    sudo apt-get install "$1" --assume-yes > /dev/null
}

function AptGetRemove {
    echo "Removing $1 ..."
    sudo apt-get remove "$1" --assume-yes > /dev/null
}

function AptGetAutoRemove {
    echo "Removing unnecessary dependencies ..."
    sudo apt-get autoremove --assume-yes > /dev/null
}

function Install {
    AptGetInstall htop
    AptGetInstall cgdb
    AptGetInstall manpages-posix-dev
    AptGetInstall git
    AptGetInstall apt-file
    AptGetInstall clang
    AptGetInstall openssh-server
    AptGetInstall lcov
    AptGetInstall vim
    
    echo "Starting ssh service ..."
    sudo /etc/init.d/ssh start
}

function Remove {
    echo "Stopping ssh service ..."
    sudo /etc/init.d/ssh stop

    AptGetRemove htop
    AptGetRemove cgdb
    AptGetRemove manpages-posix-dev
    AptGetRemove git
    AptGetRemove apt-file
    AptGetRemove clang
    AptGetRemove openssh-server
    AptGetRemove lcov
    AptGetRemove vim

    AptGetAutoRemove
}

case $1 in
    --help)
    Help
    ;;

    --install)
    Install
    ;;

    --remove)
    Remove
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
