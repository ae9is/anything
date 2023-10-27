//import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers'
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand,
  Credentials,
} from '@aws-sdk/client-cognito-identity'
import { AwsCredentialIdentity } from '@smithy/types/dist-types/identity'
import { Amplify, Auth } from 'aws-amplify'
import { CognitoUser } from 'amazon-cognito-identity-js'
import logger from 'logger'
import { stringify } from 'utils'
import { AWS_ACCOUNT_ID, AWS_REGION, COGNITO_ID, IDENTITY_POOL_ID } from '../config'
import awsExports from '../config/amplify'
Amplify.configure(awsExports)

async function signInWithUsernameAndPassword(username: string, password: string) {
  try {
    Auth.signIn(username, password)
  } catch (error) {
    logger.error('Error signing in: ' + error)
  }
}

export async function signIn() {
  try {
    Auth.federatedSignIn()
  } catch (error) {
    logger.error('Error signing in: ' + error)
  }
}

export async function signOut() {
  try {
    Auth.signOut()
  } catch (error) {
    logger.error('Error signing out: ' + error)
  }
}

export async function getUser(): Promise<CognitoUser | any> {
  return Auth.currentAuthenticatedUser()
    .then((userData) => userData)
    .catch(() => logger.log('Not signed in'))
}

export async function getUserAttr() {
  const defaultAttr = {
    displayName: 'Guest',
  }
  try {
    if (!Auth.currentAuthenticatedUser()) {
      // Prevent exception from being thrown to console by Auth.currentUserInfo() if not logged in
      throw new Error()
    }
    const userInfo = await Auth.currentUserInfo()
    if (!userInfo) {
      throw new Error()
    }
    logger.debug('User info: ', userInfo)
    const identities = userInfo?.attributes?.identities
    if (!identities) {
      logger.error('No user info identities')
      throw new Error()
    }
    const attr = JSON.parse(identities)?.[0] ?? {}
    // Additionally set a display name for convenience
    const displayName =
      attr?.preferred_username || attr?.name || attr?.userId || attr?.getUsername() || 'Guest'
    attr.displayName = displayName
    logger.debug('User attributes: ', stringify(attr))
    return attr
  } catch (e) {
    logger.log('Could not get user attributes')
    return defaultAttr
  }
}

export async function getCredentialsForServices() {
  // ref: https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#working-with-aws-service-objects
  return Auth.currentCredentials().then((credentials) => Auth.essentialCredentials(credentials))
}

// Caches credentials, updating when expired
export class ApiCredentials {

  // Similar type to Credentials, but needed for SignatureV4
  private _credentials: AwsCredentialIdentity = {
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: undefined,
    expiration: undefined,
  }

  async getCredentials() {
    let creds = this._credentials

    // Get authentication token from Amplify login
    // ref: https://stackoverflow.com/questions/48777321
    const session = await Auth.currentSession()
    logger.debug('Retrieving credentials for session: ', session)
    const idTokenJwt = session?.getIdToken()?.getJwtToken()

    // If we have a session and credentials that aren't expired, skip retrieving new credentials
    if (idTokenJwt && creds?.expiration && creds.expiration > new Date()) {
      logger.debug('Current credentials: ', creds)
      logger.debug('Already have valid credentials, skipping ...')
      return creds
    }

    // Use Amplify token to retrieve credentials

    // Ideally would simplify with fromCognitoIdentityPool() but the wrong credentials are retrieved
    // ref: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/loading-browser-credentials-cognito.html
    // ref: https://stackoverflow.com/a/73024847
    //  const credProvider = fromCognitoIdentityPool({
    //    identityPoolId: IDENTITY_POOL_ID,
    //    accountId: AWS_ACCOUNT_ID,
    //    clientConfig: {
    //      region: AWS_REGION,
    //    },
    //    logins: {
    //      [COGNITO_ID]: idTokenJwt,
    //    },
    //  })
    //  const client = new CognitoIdentityClient({
    //    region: AWS_REGION,
    //    credentials: credProvider,
    //  })
    //  const creds = await client?.config?.credentials()

    // Enhanced (simplified) authflow, manually calling low level API to retrieve correct credentials
    // ref: https://docs.aws.amazon.com/cognito/latest/developerguide/authentication-flow.html
    const client = new CognitoIdentityClient({ region: AWS_REGION })
    const getIdInput = {
      AccountId: AWS_ACCOUNT_ID,
      IdentityPoolId: IDENTITY_POOL_ID,
      Logins: {
        [COGNITO_ID]: idTokenJwt,
      },
    }
    const getIdCommand = new GetIdCommand(getIdInput)
    const getIdResp = await client.send(getIdCommand)
    const identityId = getIdResp?.IdentityId
    if (identityId) {
      const getCredsInput = {
        IdentityId: getIdResp?.IdentityId,
        Logins: {
          [COGNITO_ID]: idTokenJwt,
        },
      }
      const getCredsCmd = new GetCredentialsForIdentityCommand(getCredsInput)
      const getCredsResp = await client.send(getCredsCmd)
      const credentials: Credentials | undefined = getCredsResp?.Credentials
      creds = {
        accessKeyId: credentials?.AccessKeyId ?? '',
        secretAccessKey: credentials?.SecretKey ?? '',
        sessionToken: credentials?.SessionToken,
        expiration: credentials?.Expiration,
      }
    }

    logger.debug('Retrieved credentials: ', creds)
    this._credentials = creds
    return creds
  }
}

const apiCreds = new ApiCredentials()

export async function getCredentialsForApi() {
  return apiCreds.getCredentials()
}
