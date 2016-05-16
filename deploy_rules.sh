#!/usr/bin/env bash

. load.sh

blaze rules.yaml

curl -X PUT --data "@rules.json" "${FIREBASE_URL}/.settings/rules.json?auth=${FIREBASE_SECRET}"