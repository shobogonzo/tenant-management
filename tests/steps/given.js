const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const chance = require('chance').Chance();
require('dotenv').config();

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({
    length: 4,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  const password = chance.string({ length: 10 });
  const email = `${firstName}-${lastName}-${suffix}@test.com`;

  return {
    firstName,
    lastName,
    password,
    email,
  };
};

const an_authenticated_user = async () => {
  const { email, firstName, lastName, password } = a_random_user();

  const cognito = new CognitoIdentityProviderClient();
  const userPoolId = process.env.USER_POOL_ID;
  const clientId = process.env.USER_POOL_CLIENT_ID;
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });

  const username = `${firstName.charAt(0)}${lastName}-${suffix}`.toLowerCase();

  await cognito.send(
    new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ],
    })
  );
  console.log(`[${email}] - user has signed up [${username}]`);

  await cognito.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
  );
  console.log(`[${email}] - confirmed sign up`);

  const auth = await cognito.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    })
  );
  console.log(`$[${email}] - signed in`);

  return {
    username,
    firstName,
    lastName,
    email,
    idToken: auth.AuthenticationResult.IdToken,
    accessToken: auth.AuthenticationResult.AccessToken,
  };
};

module.exports = {
  a_random_user,
  an_authenticated_user,
};
