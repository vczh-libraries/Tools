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
    echo "        libc++-dev"
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

APTGET_TARGETS=(
    htop
    cgdb
    manpages-posix-dev
    git
    apt-file
    clang
    libc++-dev
    openssh-server
    lcov
    vim
    compizconfig-settings-manager
    )
# xfce4
# xrdp

function Install {
    for i in "${APTGET_TARGETS[@]}"; do
        AptGetInstall $i
    done
    
    echo "Starting ssh service ..."
    sudo /etc/init.d/ssh start
    
    # echo "Starting xrdp service ..."
    # echo xfce4-session >~/.xsession
    # sudo service xrdp restart
}

function Remove {
    echo "Stopping ssh service ..."
    sudo /etc/init.d/ssh stop

    # echo "Stopping xrdp service ..."
    # sudo service xrdp stop
    
    for i in "${APTGET_TARGETS[@]}"; do
        AptGetRemove $i
    done

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
