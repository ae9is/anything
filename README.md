# anything

anything is a document storage / item management system designed to be flexible about the underlying data schema.

Anyone with an AWS account can setup a user directory in IAM Identity Center, edit a couple environment variables, and deploy (or remove) the system with one command.

Then users can view data, and import/export spreadsheets via a web app. The system is serverless, with provisioned resources billed per use.

_Please note this is an example app not intended for production. If you want to use the code in a production app under the terms of the AGPL, you'll need to grab a [MUI license](https://mui.com/x/introduction/licensing/) or rework the code to remove x-data-grid-premium._

## Architecture

- Serverless Framework api run by AWS Lambda functions fronted by HTTP gateway. Can be run off localhost via Serverless plugins.
- DynamoDB picked for on demand document storage.
- Almost all infrastructure defined in code, except authorisation provider (IAM Identity Center, currently lacks much CloudFormation support).
- Client run on Next.js via the experimental app router (but just exported to a static bundle for hosting via an S3 bucket anyways).
- MUI's x-data-grid powers client data tables. TailwindCSS used for styling with daisyUI on top to simplify basic component styling and add theming support.

### C4 Diagrams

1. System context

```mermaid
C4Context
  %% title System context
  Enterprise_Boundary(net, "Internet") {
    System(anything, "anything<br>item management system", "Allows users to view, import, and export item data")
    Enterprise_Boundary(org, "Organisation") {
      Person(user, "User", "Organisation member with user directory<br>privileges to access anything")
      SystemDb_Ext(userdir, "User directory", "Stores organisation member info,<br>including which users can access anything")
      Person_Ext(admin, "Admin", "Privileges to modify user directory")
      System_Ext(inventory, "Inventories", "Physical item inventories")
      System_Ext(sheets, "Spreadsheets", "Casual collections of inventory item info,<br>other document storage")
    }
  }
  BiRel(user, anything, "Imports/exports sheets<br>and queries items")
  UpdateRelStyle(user, anything, $offsetY="-50", $offsetX="-140")
  BiRel(user, inventory, "Tracks updates<br>and modifies")
  UpdateRelStyle(user, inventory, $offsetY="0", $offsetX="-90")
  BiRel(user, sheets, "Creates<br>and pulls")
  UpdateRelStyle(user, sheets, $offsetY="0", $offsetX="10")
  Rel(admin, userdir, "Edits")
  UpdateRelStyle(admin, userdir, $offsetY="10", $offsetX="0")
  Rel(anything, userdir, "Checks user authentication<br>and authorisation")
  UpdateRelStyle(anything, userdir, $offsetY="-50", $offsetX="-80")
  Rel(userdir, user, "Sends auth<br>related email")
  UpdateRelStyle(userdir, user, $offsetY="20", $offsetX="-30")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

2. Containers

```mermaid
C4Container
  %% title Containers
  Person(user, User, "Member of user directory<br>with privileges to access anything")
  System_Ext(userdir, "User directory", "IAM Identity Center, Cognito")
  Container_Boundary(anything, "anything item management system") {
    Container(cdn, "Content delivery network", "Cloudfront, S3", "Delivers single page app<br>hosted on S3 bucket to user<br>from a nearby edge location")
    Container(spa, "Single page app", "Next.js, Typescript, React", "Provides item management<br>functionality to users<br>via web browser")
    Container(api, "API", "Serverless framework,<br>AWS HTTP gateway,<br>lambda functions", "Interface for app to database")
    ContainerDb(database, "Database", "DynamoDB", "Stores items,<br>collections of items of different types")
  }
  Rel(user, cdn, "Visits hosting domain", "HTTPS")
  UpdateRelStyle(user, cdn, $offsetY="-50", $offsetX="-130")
  Rel(cdn, spa, "Delivers to<br>user's browser")
  UpdateRelStyle(cdn, spa, $offsetY="20", $offsetX="-40")
  Rel(user, spa, "Imports, exports,<br>and views items")
  UpdateRelStyle(user, spa, $offsetY="-40", $offsetX="-45")
  Rel(spa, api, "Calls", "async HTTPS<br>/ JSON")
  UpdateRelStyle(spa, api, $offsetY="-40" $offsetX="-30")
  Rel(spa, userdir, "Authenticates<br>and gets API credentials")
  UpdateRelStyle(spa, userdir, $offsetY="-50" $offsetX="10")
  Rel(api, database, "Performs CRUD operations", "AWS SDK for JS v3<br>lib-dynamodb")
  UpdateRelStyle(api, database, $offsetY="40", $offsetX="-30")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Running locally

Edit the environment variables in .env as appropriate and load using [direnv](https://direnv.net/).


Refer to `packages/api/README.md` and `packages/app/README.md` for setting up the serverless api and web app.

After you've setup the api and app, you can spin up all projects at once with Turborepo using:

```sh
npm run dev
```

## Deployment

Refer to the readmes for `packages/api` and `packages/app` to deploy the backend and host the web app on the client.

## Monorepo structure

This Turborepo includes the following packages and apps:

- `api`: a [Serverless](https://serverless.com/) api on AWS or localhost
- `app`: a [Next.js](https://nextjs.org/) app using app router
- `logger`: a small wrapper around console.log
- `utils`: some shared code between api and app
- `eslint-config-*`: ESLint configurations
- `tsconfig`: tsconfig.json's used throughout the monorepo
