#!/bin/bash

cd <PATH>
export VCPROOT=<VCPROOT>
exec bash --rcfile "${VCPROOT}/vl/start.sh" -i
