#!/bin/bash

function Help {
    echo "Usage:"
    echo "--evaluate <t4-template-file>"
    echo "    Evaluate the template file and print to standard output."
}

function Error {
    (>&2 echo "Error(Row:${ROW_NUMBER}, Col:${COLUMN_NUMBER}): $1")
    (>&2 echo "    In: ${LINE}")
    exit 1
}

function Evaluate {
    IFS=
    STATE_TEXT=1
    STATE_CODE=2
    STATE_EXPR=3

    STATE=$STATE_TEXT
    ROW_NUMBER=1

    echo "#!/bin/bash"
    echo ""

    cat $1 | while read -r LINE; do
        COLUMN_NUMBER=0

        PARTS=`echo $LINE | sed -r -e 's%(<#=\s*|<#\s*|\s*#>)%\n\1\n%g'`
        PARTS=`echo "$PARTS" | sed -r -e 's%^<#=\s*$%<#=%g;s%^<#\s*$%<#%g;s%^\s*#>$%#>%g'`
        PURE_COMMAND=1

        while read -r PART; do
            case "$PART" in
                "")
                ;;

                "<#")
                if [ $STATE == $STATE_TEXT ]; then
                    STATE=$STATE_CODE
                else
                    Error "\"<#\" and \"<#=\" cannot be embedded in each other."
                fi
                ;;

                "<#=")
                if [ $STATE == $STATE_TEXT ]; then
                    STATE=$STATE_EXPR
                else
                    Error "\"<#\" and \"<#=\" cannot be embedded in each other."
                fi
                ;;

                "#>")
                if [ $STATE == $STATE_TEXT ]; then
                    Error "Wrong place for \"#>\"."
                else
                    STATE=$STATE_TEXT
                fi
                ;;

                *)
                if [ $STATE == $STATE_CODE ]; then
                    echo "${PART}"
                elif [ $STATE == $STATE_EXPR ]; then
                    PURE_COMMAND=0
                    echo "echo -n ${PART}"
                else
                    PURE_COMMAND=0
                    echo "echo -n '${PART}'"
                fi
                ;;
            esac

            COLUMN_NUMBER=`echo "$(($COLUMN_NUMBER+${#PARTS}))"`
        done <<< "${PARTS}"

        if ( [ "$LINE" == "" ] && [ $STATE == $STATE_TEXT ] ) || [ $PURE_COMMAND == 0 ]; then
            echo 'echo ""'
        fi
        ROW_NUMBER=`echo "$(($ROW_NUMBER+1))"`
    done
}

case $1 in
    --help)
    Help
    ;;

    --evaluate)
    Evaluate $2
    ;;

    *)
    echo "Use --help for more information."
    ;;
esac
