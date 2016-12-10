#!/bin/bash
cd ../../Vlpp/Tools/MakeGen
mkdir Bin
mkdir Obj
make clean
make
ln -f -s `pwd`/Bin/MakeGen /usr/local/bin/MakeGen

cd ../ParserGen
cp makefile makefile~
MakeGen release makefile
mkdir Bin
mkdir Obj
make clean
make
cp makefile~ makefile
rm makefile~
ln -f -s `pwd`/Bin/ParserGen /usr/local/bin/ParserGen
