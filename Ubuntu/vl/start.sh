#!/bin/bash

export VROOT=${PWD}
export PATH=${VCPROOT}/vl/cmd:${PATH}

for i in "$( ls ${VCPROOT}/vl/cmd/v* )"; do
    chmod u+x $i
done

function vreset {
    pushd $VROOT > /dev/null
    source ${VCPROOT}/vl/start.sh
    popd > /dev/null
}
export -f vreset

function vgo {
    source vgo "$@"
}
export -f vgo

export VC_BLACK='\033[00;30m'
export VC_RED='\033[00;31m'
export VC_GREEN='\033[00;32m'
export VC_BROWN='\033[00;33m'
export VC_BLUE='\033[00;34m'
export VC_PURPLE='\033[00;35m'
export VC_CYAN='\033[00;36m'
export VC_LIGHTGRAY='\033[00;37m'

export VC_DARKGRAY='\033[01;30m'
export VC_LIGHTRED='\033[01;31m'
export VC_LIGHTGREEN='\033[01;32m'
export VC_YELLOW='\033[01;33m'
export VC_LIGHTBLUE='\033[01;34m'
export VC_LIGHTPURPLE='\033[01;35m'
export VC_LIGHTCYAN='\033[01;36m'
export VC_WHITE='\033[01;37m'

export VC_DEFAULT='\033[00m'

function PromptCommand {
    local TITLE="\[\e]0;\u@\h: \w\a\]"
    local USER="\[${VC_LIGHTGREEN}\]\u\[${VC_DEFAULT}\]"

    local GITHEAD="$(git symbolic-ref HEAD 2>/dev/null)"
    if [ "${GITHEAD}" == "" ]; then
        local GITREF=""
    else
        local PROJECTPATH="$(git rev-parse --show-toplevel)"
        local PROJECT="${PROJECTPATH##${VROOT}/}"
        local GITREF_1="\[${VC_LIGHTBLUE}\]${PROJECT}\[${VC_DEFAULT}\]"

        local BRANCH="${GITHEAD##refs/heads/}"
        local STATUS="$(git status --porcelain)"
        if [ "${STATUS}" == "" ]; then
            local BRANCHCOLOR=$VC_LIGHTCYAN
            local BRANCHSIGN=""
        else
            local BRANCHCOLOR=$VC_LIGHTRED
            local BRANCHSIGN="*"
        fi
        local GITREF_2="\[${BRANCHCOLOR}\]${BRANCH}${BRANCHSIGN}\[${VC_DEFAULT}\]"

        local GITREF="@${GITREF_1}:${GITREF_2}"
    fi

    PS1="${TITLE}${USER}${GITREF}$ "
}
export -f PromptCommand
export PROMPT_COMMAND="PromptCommand"

if [ -a ~/.ssh/id_rsa_vl ]; then
    eval "$(ssh-agent -s)"
    pushd ~/.ssh > /dev/null
    ssh-add id_rsa_vl
    popd > /dev/null
fi

echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vhelp for help information."
