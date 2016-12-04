#!/bin/bash

cd vl

export VPATH_CONTROL=${PWD}/vl
export VDOWNLOAD=curl -H "Cache-Control: no-cache" -O

export PATH=${VPATH_CONTROL}:${PATH}

${VDOWNLOAD} https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-ssh.sh
${VDOWNLOAD} https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-apt.sh
${VDOWNLOAD} https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-enlist.sh
chmod u+x vl-*.sh
cd ..

echo Welcome to Vczh Libraries Control Panel!
