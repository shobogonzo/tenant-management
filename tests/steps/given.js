const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  InitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const chance = require('chance').Chance();
require('dotenv').config();

const a_random_user = () => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  const username = `${firstName.charAt(0)}${lastName}-${suffix}`;
  const password = chance.string({ length: 10 });
  const email = `${firstName}-${lastName}-${suffix}@test.com`;

  return {
    firstName,
    lastName,
    username,
    password,
    email,
  };
};

const an_existing_tenant = async (name, status) => {
  const tenantId = chance.guid();

  console.log(
    `adding tenant [${tenantId}] to table [${process.env.TENANT_TABLE}]`
  );
  const createdAt = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: process.env.TENANT_TABLE,
      Item: {
        PK: `TENANT#${tenantId}`,
        SK: `DETAILS#${name}`,
        name,
        status,
        createdAt,
      },
    })
  );

  return {
    id: tenantId,
    name,
    status,
    createdAt,
  };
};

const an_existing_user = async (role, status, tenantId) => {
  const firstName = chance.first({ nationality: 'en' });
  const lastName = chance.last({ nationality: 'en' });
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  const username = `${firstName.charAt(0)}${lastName}-${suffix}`;
  const email = `${firstName}-${lastName}-${suffix}@test.com`;

  console.log(
    `adding user [${username}] to tenant [${tenantId}] in table [${process.env.TENANT_TABLE}]`
  );
  await docClient.send(
    new PutCommand({
      TableName: process.env.TENANT_TABLE,
      Item: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
        username,
        firstName,
        lastName,
        email,
        role,
        status,
      },
    })
  );

  return {
    username,
    firstName,
    lastName,
    email,
  };
};

const an_authenticated_user = async (role) => {
  const { email, firstName, lastName, username, password } = a_random_user();
  const tenantId =
    role === 'SYS_ADMIN' ? process.env.SERVICE_NAME : chance.guid();
  console.log(`[${username}] - creating user under tenant [${tenantId}]`);

  const cognito = new CognitoIdentityProviderClient();
  const userPoolId = process.env.USER_POOL_ID;
  const clientId = process.env.USER_POOL_CLIENT_ID;

  await cognito.send(
    new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:tenantId', Value: tenantId },
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
  an_existing_tenant,
  an_existing_user,
  an_authenticated_user,
};
