# Infrastructure

This folder exists just to help break up the necessary infrastructure for anything 
into multiple resource files that can be redeployed independently by Serverless Framework.

Database resources are defined in `packages/api` to collocate the database schema
with the migrations and seeding code needed for offline development plugins.

- `auth` - Authentication and authorisation resources
- `data` - Data lake storage and analytics resources
- `web` - Web client hosting resources
- `database` - DynamoDB database
- `dash` - Live dashboard service via Grafana, requires additional setup
