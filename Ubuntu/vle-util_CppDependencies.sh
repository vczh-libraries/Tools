#!/bin/bash

echo `clang++ --std=c++14 -MM $1` | sed -r -e 's%[\]\s*%%g'
