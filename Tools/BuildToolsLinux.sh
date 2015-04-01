#!/bin/bash
cd MakeGen
mkdir Bin
mkdir Obj
make clean
make
cd ..
ln -f -s `pwd`/MakeGen/Bin/MakeGen /usr/local/bin/MakeGen

cd ParserGen
MakeGen release makefile
mkdir Bin
mkdir Obj
make clean
make
cd ..
ln -f -s `pwd`/ParserGen/Bin/ParserGen /usr/local/bin/ParserGen
