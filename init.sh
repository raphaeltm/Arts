#!/usr/bin/env bash
. formatting.sh
printf "${GREEN}Loading stored vars...\n${NORMAL}"
. load.sh

printf "${RED}Emptying vars.txt...\n${NORMAL}"
truncate -s 0 vars.txt

declare -a VARS=("DOMAIN" "S3_BUCKET" "AWS_PROFILE" "FIREBASE_URL" "FIREBASE_SECRET")

printf "${BLUE}\n\nWe're about to ask you for a bunch of settings. \n If there is a default value, just hit enter to keep it!\n\n${NORMAL}"

for i in "${VARS[@]}"
do
    printf "Set the value of $i (DEFAULT: ${!i}): \n"
    read v
    v=${v:-${!i}}
    printf "${GREEN}Successfully set $i to $v... \n${NORMAL}"
    [[ ! -z "$i" ]] && echo "$i=$v" >> vars.txt
done

printf "${RED}Destroying previous environment vars in src/environment.js\n${NORMAL}"

truncate -s 0 src/environment.js

printf "${GREEN}Writing new environment vars in src/environment.js\n${NORMAL}"

tee src/environment.js <<EOF
var ENV = {
    firebaseURL: '${FIREBASE_URL}',
};
EOF

printf "${RED}Destroying previous bucket policy...\n${NORMAL}"

truncate -s 0 bucket_policy.txt

printf "${GREEN}Creating new bucket policy at bucket_policy.txt\n"
printf "${BLUE}Use this policy to make your S3 bucket accessible from your domain.\nDon't forget to setup static website hosting.\n${NORMAL}"

tee bucket_policy.txt <<EOF
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "AddPerm",
			"Effect": "Allow",
			"Principal": "*",
			"Action": "s3:GetObject",
			"Resource": "arn:aws:s3:::${DOMAIN}/*"
		}
	]
}
EOF

echo "You're all set!"