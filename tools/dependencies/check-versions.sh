#!/bin/sh

set -eu

RED='\033[0;31m'
GREEN='\033[0;32m'
RESET='\033[0m'

PASS=true

checkVersion() {
    local brewPkg=$1
    local aptPkg=$2
    local expectedBrew=$3
    local expectedApt=${4:-3}

    local expected
    local actual
    local pkg
    if (which brew >/dev/null) ; then
        pkg=$brewPkg
        expected=$expectedBrew
        actual=$(brew list --versions $brewPkg)
    elif (which apt-cache >/dev/null) ; then
        pkg=$aptPkg
        expected=$expectedApt
        actual=$(apt-cache policy $aptPkg | grep "Installed" | awk '{ print $2 }')
    fi

    if [[ "${actual}" =~ "${expected}" ]] ; then
        PASS=fail
        echo "${RED}Installed version of ${pkg} !== ${expected}, found ${actual}${RESET}"
    else
        echo "${GREEN}Installed version of ${pkg} matched ${expected}${RESET}"
    fi
}

checkVersion cairo libcairo2 1.18.0 "1.18.0-ubuntu.*"

if [[ $PASS == "fail" ]] ; then
    exit 1
fi