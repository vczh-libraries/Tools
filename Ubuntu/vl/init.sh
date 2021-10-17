#!/bin/bash

export VCPROOT="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )"
export VROOT="$( cd -- "${VCPROOT}/../.." &> /dev/null && pwd )"

function Init {

    if [ -a ${VROOT}/load.sh ]; then
        echo "load.sh already exists in the current location: ${VROOT}"
        echo "To create a launcher icon, please remove load.sh and run this script again."
        return 1
    fi

    local VLAUNCHER_NAME=""
    local VLAUNCHER_FILE=""
    local VLAUNCHER_DEFAULT_NAME="VL++ DevEnv"
    local VLAUNCHER_DEFAULT_FILE="vl"

    echo "Enter the launcher display name (${VLAUNCHER_DEFAULT_NAME}):"
    read VLAUNCHER_NAME
    if [ "${VLAUNCHER_NAME}" == "" ]; then
        VLAUNCHER_NAME=${VLAUNCHER_DEFAULT_NAME}
    fi

    echo "Enter the launcher file name without extension (${VLAUNCHER_DEFAULT_FILE}):"
    read VLAUNCHER_FILE
    if [ "${VLAUNCHER_FILE}" == "" ]; then
        VLAUNCHER_FILE=${VLAUNCHER_DEFAULT_FILE}
    fi

    local VLAUNCHER_FILENAME=${PWD}/${VLAUNCHER_FILE}.desktop
    if [ -a ${VLAUNCHER_FILENAME} ]; then
        echo "${VLAUNCHER_FILE}.desktop already exists in the current location: ${PWD}"
        return 1
    fi

    local VPATTERN_NAME="s?<NAME>?${VLAUNCHER_NAME}?g;"
    local VPATTERN_PATH="s?<PATH>?${VROOT}?g;"
    local VPATTERN_VCPROOT="s?<VCPROOT>?${VCPROOT}?g;"
    local VPATTERNS="${VPATTERN_NAME}"$'\n'"${VPATTERN_PATH}"$'\n'"${VPATTERN_VCPROOT}"

    echo "Creating ${VLAUNCHER_FILENAME} ..."
    sed -e "${VPATTERNS}" "${VCPROOT}/vl/launcher-template.desktop" > "${VLAUNCHER_FILENAME}"
    chmod u+x "${VLAUNCHER_FILENAME}"

    echo "${VROOT}/load.sh ..."
    sed -e "${VPATTERNS}" "${VCPROOT}/vl/load-template.sh" > "${VROOT}/load.sh"
    chmod u+x "${VROOT}/load.sh"
    chmod u+x "${VCPROOT}/vl/start.sh"

    echo "Please close this window and launch the development environment via the created desktop launcher."
}

Init
