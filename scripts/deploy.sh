#!/bin/sh
now="npx now --debug --token=$NOW_TOKEN"

echo "$ now rm --safe --yes ci-reporter"
$now rm --safe --yes ci-reporter

echo "$ now --public"
$now --public

echo "$ now alias"
$now alias
