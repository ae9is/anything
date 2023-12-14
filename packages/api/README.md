# api

An api using AWS HTTP API + Lambda functions + DynamoDB, deployed or runnable offline using Serverless framework.

## Setup

You need to setup node dependencies, Serverless Framework, and (optionally) a local DynamoDB instance for running locally.

### Node prep

Make sure to install serverless globally:

```bash
npm i -g serverless
```

Then:

```bash
npm i
```

### Local DynamoDB instance

Quickstart: `npm run db`

#### Local DynamoDB via Serverless
To run a local DynamoDB via serverless.yml, make sure `noStart=false` in serverless.yml and:

1. Install java and make sure it's in $PATH
2. `sls dynamodb install`
3. `sls dynamodb start --migrate`

#### Local DynamoDB via Docker
Alternatively, Docker compose can be used to spin up the local DynamoDB database, `docker compose up` from top level of repository, with `COMPOSE_PROFILES=dev`. Make sure `noStart=true` in serverless.yml _(custom:dynamodb:start:noStart:true)_. Then:

1. `docker compose up`
2. `cd packages/api`
2. `sls dynamodb migrate`

Another option could be to a local DynamoDB instance via docker started automatically by serverless.yml (i.e. docker=true, noStart=false), but your mileage may vary here.

#### Configuring AWS CLI

To run commands directly against a local DynamoDB instance, download and install the AWS CLI: https://aws.amazon.com/cli/

Set it up using (ref: https://stackoverflow.com/questions/35428640/)

```sh
aws configure
```

Then commands should be able to be run via `--endpoint-url http://localhost:5000`, for ex:

```sh
aws dynamodb list-tables --endpoint-url http://localhost:5000
```

## Run

### Run locally

1. Unfortunately, dummy credentials don't work with serverless better credentials plugin, 
 so you'll either need to login with a real AWS account each time or rework serverless.yml.
 Replace "admin" with your `AWS_PROFILE` environment variable.

    ```bash
    aws sso login --sso-session admin
    ```

2. Start a development server emulating cloud services:

    ```bash
    npm run dev
    ```

3. _(Optional)_ Example command to quickly check requests resolve as expected:

```bash
curl -X GET http://localhost:4000/v1/types
```

### Run on the cloud

Some things, like authorisation, aren't supported by Serverless offline's local emulation. If you want to deploy to production or test these things, there's a few extra steps to be able to deploy resources to the cloud and to setup a user directory.

For example (using linux and IAM identity center as the user directory):

1.  IAM Identity Center (SSO) setup:
    1. First enable IAM Identity Center following: https://aws.amazon.com/iam/identity-center/
    1. Add two users, `dev` and `admin`: `admin` for serverless deployments; `dev` for app testing
    1. Add two groups, `Anything` and `Admins` to Groups
    1. Add `dev` to `Anything` and `admin` to `Admins`
    1. Add a permission set `AdministratorAccess` based on the `AdministratorAccess` AWS managed policy
    1. Assign the permission set to the `Admins` group under `AWS accounts → Assign users or groups`
    1. Add a custom SAML 2.0 application with the following configuration:
        - Display name: Anything
    1. Edit the custom application's attribute mappings:
        - Map `Subject` to `${user:subject}`, Format: persistent
    1. Later on (see step 9) you will need to edit the following application configuration:
        - Application ACS URL: `https://<COGNITO_USER_POOL_DOMAIN>/saml2/idpresponse`
        - Application SAML audience: `urn:amazon:cognito:sp:<COGNITO_USER_POOL_ID>`

2. Make sure the Serverless user (for ex. `admin` above) you create has enough permissions to deploy. AWS' PowerUserAccess role will not suffice. It does not have permissions to manage IAM.

    Then, see the Serverless guide to setting up AWS credentials: https://www.serverless.com/framework/docs/providers/aws/guide/credentials

    If you don't want to use an admin role, you can see this Serverless example for a slightly better set of credentials:
    https://gist.github.com/ServerlessBot/7618156b8671840a539f405dea2704c8

    You should edit this example for your own scenario. An example of a tool to generate more restrictive permissions: https://open-sl.github.io/serverless-permission-generator/

3. Install AWS CLI

    ```bash
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    # or update:
    $ sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update
    ```

    (ref: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

4. Configure CLI session and login

    ```bash
    aws configure sso
    # enter info...
    aws sso login --sso-session SESSION_NAME
    ```

5. Check the resulting config at `~/.aws/config` and make sure it matches what you expect, for ex:

    ```
    [profile admin]
    region = us-east-1
    sso_session = admin
    sso_account_id = 123456789012
    sso_role_name = AdministratorAccess

    [sso-session admin]
    sso_region = us-east-1
    sso_start_url = https://my-sso-portal.awsapps.com/start
    sso_registration_scopes = sso:account:access
    ```

    (ref: https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html)

6. Note that dummy AWS credentials don't currently work with the serverless better credentials plugin, which is used to be able to integrate Serverless Framework and AWS SSO (IAM Identity Center).
 
    You can test out using a dummy profile yourself:

    - Add an extra dummy profile in `~/.aws/config` file for serverless offline plugin, for example for default:

        ```
        [default]
        region=x
        ```

        You can try setting a different non-default profile name if you specify `AWS_DEFAULT_PROFILE` in .env.

    - Add extra dummy credentials in `~/.aws/credentials` for serverless offline plugin:

        ```
        [default]
        aws_access_key_id=DUMMY_AWS_ACCESS_KEY_ID
        aws_secret_access_key=DUMMY_AWS_SECRET_ACCESS_KEY
        ```

7. Set `AWS_PROFILE` in .env (or if using 'default' profile unset `AWS_PROFILE`)

8. At this point, the project's deploy command `npm run sls-deploy` should hopefully work. Your mileage may vary with serverless offline.

9. Follow the following guide to add the Cognito user pool you just deployed as a trusted application in your IAM Identity Center SAML settings:
    https://repost.aws/knowledge-center/cognito-user-pool-iam-integration

    _(Note: In "Configure IAM Identity Center as a SAML IdP in your user pool", don't map username--Cognito does this automatically and may throw an error if you do.)_

    Under application properties, to enable sign-on from the AWS apps portal you can set the following...

    Application start URL:
    `https://<cognito auth domain>.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=code&client_id=<web app client id>&redirect_uri=<app url>&identity_provider=<cognitor user pool idp name>&scope=openid+email+profile+aws.cognito.signin.user.admin`

    Relay state:
    `<app url>`

    Where app url is one of:
    - _(development)_ `http://localhost:3000`
    - _(production)_ `https://<app_cloudfront_id>.cloudfront.net`

10. For future deployment or local development sessions:
    - Make sure to sign on again with the aws cli as needed: `aws sso login --sso-session SESSION_NAME`
    - Copy short term credentials to `~/.aws/credentials`, if they've changed
