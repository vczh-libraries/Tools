#!/bin/bash

cd vl
export VPATH_CONTROL=$(PWD)/vl
export PATH=$(VPATH_CONTROL):$(PATH)
curl -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-ssh.sh
curl -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-apt.sh
curl -O https://raw.githubusercontent.com/vczh-libraries/Tools/master/Ubuntu/vl-enlist.sh
chmod u+x vl-*.sh
cd ..

echo Welcome to Vczh Libraries Control Panel!
