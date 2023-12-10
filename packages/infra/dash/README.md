# Dashboard infrastructure

Setup a Grafana Cloud dashboard. Queries data via Amazon Athena plugin for Grafana.

_Note: No Terraform support for non-core data sources (like grafana-athena-datasource), and Grafana dash embeds don't even work properly right now, so skipping infrastructure-as-code for the time being._

## Deploy AWS permissions for Grafana

Using serverless compose as for other serverless framework packages in this repo.

## Log in to AWS CLI

Don't forget to login to the AWS CLI before the following steps, for example if you have setup a single sign-on profile before:
`aws sso login --sso-session <username>`

If not: https://aws.amazon.com/cli/

## Create Grafana access key

Create an access key for Grafana to access the AWS Grafana user that was created:
`aws iam create-access-key --user-name <grafana_username>`

### Updating and deleting access keys

To disable the access key:
`aws iam update-access-key --user-name <grafana_username> --access-key-id <key_id> --status Inactive`

See the following for notes on key deletion:
https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#rotating_access_keys_cli

## Grafana manual config 

1. Create a new Grafana Cloud account and setup an instance of Grafana: https://grafana.com/
1. Install the Amazon Athena plugin for Grafana: https://grafana.com/grafana/plugins/grafana-athena-datasource/?tab=installation
1. Home > Connections > Data sources > Add new connection > Amazon Athena
1. Enter connection details: specify previously generated keys, region, and the ARN of the Grafana role
1. Enter Athena details: select data source, database, and workgroup 
1. (Optional) Enable Cache and set caching time
1. Add plugin "Plotly" to Grafana Cloud instance: https://grafana.com/grafana/plugins/nline-plotlyjs-panel/?tab=installation
1. Create a dashboard from `dashboard.json` template: Home > Dashboards > Import dashboard > Import via dashboard JSON model
1. Alternatively, create a new dashboard with panels for each named query specified in `infra/data/_resources.yml`:
  - ItemCountsByType: Pie chart with "Value options > Show > All Values", plus "Pie chart > Labels > Percent"
  - UserActivity: Plotly visualization with "Script Editor" contents set to `infra/dash/plotly.js`

Troubleshooting Plotly graphs:
- It might take a long time for Grafana Cloud to install plugins into your instance so you can select "Plotly" as the panel type
- If you can't see the "Script Editor" panel with the Plotly visualization type, as a workaround you can inject this CSS into the page:
```css
div[data-testid="data-testid Code editor container"] {
  height: 100%;
}
```

## Updating plots workflow

Workflow to keep plots definitions in a legible format in source control.

Workflow for updating plots that use Plotly in Grafana:
1. Edit plotly.js with changes
2. Select dashboard panel > Edit > Make paste changes in "Script Editor" field

Plus, workflow for all changes:
3. Save dashboard > Settings > Copy JSON model
4. Paste updated JSON model into dash.json

## Embedding dashboard in web app

Public dashboards and snapshots, and local snapshots within an authenticated browser window, should be able to be embedded using Grafana Cloud.

ref: https://grafana.com/blog/2023/10/10/how-to-embed-grafana-dashboards-into-web-applications/

Once the dashboard has been shared, copy paste the share link into `packages/app/src/config/config.ts` variable `DASHBOARD_URL`, for example:

```ts
// For snapshots
export const DASHBOARD_URL = 'https://<grafana_url>.grafana.net/dashboard/snapshot/<dash_link_id>'
// For public dashboard
export const DASHBOARD_URL = 'https://<grafana_url>.grafana.net/public-dashboards/<dash_link_id>'
```

***_Currently, dashboard embeds are broken, but linkouts to the dash still work for demo purposes_***

## Dashboard alternatives

Low cost alternative live dashboarding solutions could be:
- AWS Managed Grafana https://aws.amazon.com/grafana/
- AWS QuickSight https://aws.amazon.com/quicksight/