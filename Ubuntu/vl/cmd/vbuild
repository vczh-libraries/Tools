#!/bin/bash

function Help {
    echo "Usage:"
    echo "<--build>"
    echo "    Incrementally build the current folder."
    echo "--full"
    echo "    Rebuild the current folder."
    echo "--coverage"
    echo "    Rebuild the current folder with coverage."
    echo "--generate"
    echo "    Generate coverage data."
    echo "--read"
    echo "    Read coverage data."
}

function Check {
    if ! [ -a vmake ]; then
        echo "Cannot find ./vmake ."
        exit 1
    fi
}

function Build {
    Check
    make
}

function Full {
    Check
    make clean
    make
}

function Coverage {
    Check
    make clean
    make COVERAGE=YES
}

function Generate {
    Check
    PATTERN='^(.+)?\.o:\s*((.+)?.cpp).*$'
    CPP_FILES=`cat makefile \
        | grep -E ${PATTERN} \
        | sed -r -e 's%'${PATTERN}'%../\2%g'
        `
    rm -rf ./Coverage/*
    gcov -o ./Obj/ ${CPP_FILES} > /dev/null
    mv -f *.gcov ./Coverage/
    pushd ./Coverage > /dev/null
    lcov --directory ../Obj/ --capture --output-file lcov.info
    genhtml -o HTML lcov.info > /dev/null
    popd > /dev/null
}

function Read {
    Check
    sensible-browser ./Coverage/HTML/index.html 
}

case $1 in
    --help)
    Help
    ;;

    --build)
    Build
    ;;

    --full)
    Full
    ;;

    --coverage)
    Coverage
    ;;

    --generate)
    Generate
    ;;

    --read)
    Read
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
