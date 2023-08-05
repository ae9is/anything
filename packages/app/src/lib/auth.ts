import { Auth } from 'aws-amplify'
import { CognitoUser } from 'amazon-cognito-identity-js'
import logger from 'logger'

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
  const userInfo = await Auth.currentUserInfo()
  if (!userInfo) {
    logger.log('Not signed in')
    return
  }
  const attr = JSON.parse(userInfo?.attributes?.identities)?.[0] ?? {}
  // Additionally set a display name for convenience
  const displayName =
    attr?.preferred_username || attr?.name || attr?.userId || attr?.getUsername() || 'Guest'
  attr.displayName = displayName
  logger.debug('User attributes: ', JSON.stringify(attr))
  return attr
}

// ref: https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#working-with-aws-service-objects
export async function getCredentialsForServices() {
  return Auth.currentCredentials().then((credentials) => Auth.essentialCredentials(credentials))
}
