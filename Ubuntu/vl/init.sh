#!/bin/bash

export VCPROOT="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )"
export VROOT="$( cd -- "${VCPROOT}/../.." &> /dev/null && pwd )"

if [ -a ${VROOT}/load.sh ]; then
    echo "load.sh already exists in the current location: ${VROOT}"
    echo "To create a launcher icon, please remove load.sh and run this script again."
    exit 1
fi

local VLAUNCHER_NAME=""
local VLAUNCHER_FILE=""
local VLAUNCHER_DEFAULT_NAME="VL++ DevEnv"
local VLAUNCHER_DEFAULT_FILE="vl"

echo "Enter the launcher display name (${VLAUNCHER_DEFAULT_NAME}):"
read VLAUNCHER_NAME
if ! [ "${VLAUNCHER_NAME}" == ""]; then
    VLAUNCHER_NAME=${VLAUNCHER_DEFAULT_NAME}
fi

echo "Enter the launcher file name without extension (${VLAUNCHER_DEFAULT_FILE}):"
read VLAUNCHER_FILE
if ! [ "${VLAUNCHER_FILE}" == ""]; then
    VLAUNCHER_FILE=${VLAUNCHER_DEFAULT_FILE}
fi

local VLAUNCHER_FILENAME=${VLAUNCHER_FILE}.desktop
if [ -a ${VLAUNCHER_FILENAME} ]; then
    echo "${VLAUNCHER_FILENAME} already exists in the current location: ${PWD}"
    exit 1
fi

local VPATTERN_NAME="s?<NAME>?${VLAUNCHER_NAME}?g;"
local VPATTERN_PATH="s?<PATH>?${VROOT}?g;"
local VPATTERN_VCPROOT="s?<VCPROOT>?${VCPROOT}?g;"
local VPATTERNS="${VPATTERN_NAME}"$'\n'"${VPATTERN_PATH}"$'\n'"${VPATTERN_VCPROOT}"

sed -e "${VPATTERNS}" "${VCPROOT}/vl/launcher-template.desktop" > "${VFILE}"
chmod u+x "${VFILE}"

sed -e "${VPATTERNS}" "${VCPROOT}/vl/load-template.sh" > "${VPATH}/load.sh"
chmod u+x "${VPATH}/load.sh"
