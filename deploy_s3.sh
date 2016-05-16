#!/usr/bin/env bash
. formatting.sh
. load.sh

gulp build

aws s3 sync dist "s3://$S3_BUCKET" --profile $AWS_PROFILE

echo "${GREEN} S3 sync complete. App deployed!${NORMAL}"