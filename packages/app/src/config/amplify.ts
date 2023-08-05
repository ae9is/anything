import {
  IDENTITY_POOL_ID,
  AWS_REGION,
  API_HOST,
  USER_POOL_ID,
  USER_POOL_WEB_CLIENT_ID,
  OAUTH_DOMAIN,
  APP_URL,
} from './config'

export const apiName = 'HttpApi'

const awsExports = {
  // ref: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js/#set-up-backend-resources
  // ref: https://aws-amplify.github.io/amplify-js/api/interfaces/authoptions.html
  Auth: {
    identityPoolId: IDENTITY_POOL_ID,
    identityPoolRegion: AWS_REGION,
    region: AWS_REGION,
    userPoolId: USER_POOL_ID,
    userPoolWebClientId: USER_POOL_WEB_CLIENT_ID, // Amazon Cognito Web Client ID (26-char alphanumeric string)
    mandatorySignIn: false, // true, // Enforce user authentication prior to accessing AWS resources or not
    oauth: {
      domain: OAUTH_DOMAIN,
      scope: [
        //
        'email',
        'openid',
        'profile',
        'aws.cognito.signin.user.admin',
      ],
      // Must include trailing slash
      // ref: https://github.com/aws-amplify/amplify-cli/issues/7359
      redirectSignIn: `${APP_URL}/`,
      redirectSignOut: `${APP_URL}/`,
      responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
    },
  },
  // ref: https://docs.amplify.aws/lib/restapi/getting-started/q/platform/js/#manual-setup-reference-existing-rest-api
  API: {
    endpoints: [
      {
        name: apiName,
        endpoint: API_HOST,
      },
    ],
  },
}

export default awsExports
