# [Art Potato](https://arts.raphaeltm.com)

## Something, something, the arts are important to me.

### Grumble, grumble, I think they should be important to you too.

---

What you'll need to run this for cheap on your own domain (only cost being your domain):

- An AWS account, with an S3 bucket with the same name as the domain you want to serve it from. [Read more...](http://docs.aws.amazon.com/AmazonS3/latest/gsg/CreatingABucket.html)
  - Storage should be free on AWS if your account is new and qualifies for the free tier, otherwise it should still be really cheap (a few cents a month, maybe)

- Setup your s3 bucket to work for static website hosting. [Read more...](http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)
  - (The init script below will help you generate an appropriate bucket policy)

- A Firebase account, with a Firebase already setup. [Read more...](https://www.firebase.com/)

- A domain.
  - You'll need to point this to the S3 bucket. I like using [CloudFlare](https://www.cloudflare.com/) to manage my domain DNS settings. In part because everything seems to update so quickly.

- NodeJS and NPM
  - You can find those [here](https://nodejs.org/en/)

- The [Blaze Compiler](https://github.com/firebase/blaze_compiler).
  - You can install it with `npm install -g blaze_compiler`

- The [AWS CLI](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-set-up.html)

---

Initialize the project by running

```
. init.sh
```

You will be prompted to fill in the following values:

- DOMAIN: The domain you want your page to be accessible from (i.e. arts.raphaeltm.com)

- S3_BUCKET: The Amazon S3 bucket you would like to deploy to (should be the same as your domain, but might not be, if you have other plans...). [Read more...](http://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)

- AWS_PROFILE: The name of the AWS profile you're using to deploy to S3. [Read more...](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files)

- FIREBASE_URL: The url for the Firebase where you would like to store your data. [Read more...](https://www.firebase.com/)

---

To get started, start by running:

```
npm install
```

Ensure you've got the [Blaze Compiler](https://github.com/firebase/blaze_compiler) installed.
Enable [anonymous authentication](https://www.firebase.com/docs/web/guide/login/anonymous.html) on your Firebase, then get it ready by running:

```
. deploy_rules.sh
```

Then you can start playing with it locally using:

```
gulp serve
```

---

When you're ready to deploy, first run:

```
gulp build
```

then run

```
. deploy_s3.sh
```