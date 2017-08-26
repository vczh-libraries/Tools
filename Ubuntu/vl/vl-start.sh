#!/bin/bash

pushd $(dirname ${BASH_SOURCE[0]}) > /dev/null
export VCPROOT=`pwd`/..
popd > /dev/null
export VCPWD=${VCPROOT}/../..
export PATH=${VCPROOT}/vl/ControlPanel:${PATH}

function vssh {
    source vssh "$@"
}
export -f vssh

pushd ${VCPROOT}/../.. > /dev/null
if ! [ -a vl.desktop ]; then
	cp ./Tools/Ubuntu/vl/vl-template.desktop vl.desktop
	chmod u+x vl.desktop
fi
popd > /dev/null

echo "Welcome to Vczh Libraries Control Panel!"
echo "Use vhelp for help information."
