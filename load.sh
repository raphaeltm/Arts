#!/usr/bin/env bash

. formatting.sh

while IFS='' read -r line || [[ -n "$line" ]]; do
    eval "$line"
    echo "${GREEN}Loaded: ${NORMAL} $line"
done < "vars.txt"