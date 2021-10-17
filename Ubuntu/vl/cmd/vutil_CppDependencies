#!/bin/bash

echo `clang++ --std=c++14 $1 -MM $2` | sed -r -e 's%[\]\s*%%g'
