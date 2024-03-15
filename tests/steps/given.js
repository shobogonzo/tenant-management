const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  InitiateAuthCommand,
  AdminCreateUserCommand,
  RespondToAuthChallengeCommand,
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
  const email = `${firstName}-${lastName}-${suffix}@test.com`;
  const password = chance.string({ length: 10, password: true });

  return {
    firstName,
    lastName,
    email,
    password,
  };
};

const an_existing_tenant = async (name, status) => {
  const tenantId = chance.guid();

  console.log(
    `adding tenant [${tenantId}] to table [${process.env.TENANT_TABLE}]`
  );
  const createdAt = new Date().toJSON();
  await docClient.send(
    new PutCommand({
      TableName: process.env.TENANT_TABLE,
      Item: {
        PK: `TENANT#${tenantId}`,
        SK: `DETAILS`,
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
  const username = `${firstName.charAt(0)}${lastName}-${suffix}`.toLowerCase();
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
        createdAt: new Date().toJSON(),
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
  const { SERVICE_NAME, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;
  const tenantId = role === 'SYS_ADMIN' ? SERVICE_NAME : chance.guid();

  const { username, firstName, lastName, email } = await an_existing_user(
    role,
    'PENDING',
    tenantId
  );
  const tmpPassword = chance.string({ length: 10, password: true });
  console.log(
    `[${username}] - creating [${role}] Cognito user under tenant [${tenantId}]`
  );

  const cognito = new CognitoIdentityProviderClient();
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: tmpPassword,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:tenantId', Value: tenantId },
        { Name: 'email_verified', Value: 'true' },
      ],
      ClientMetadata: { role },
    })
  );
  console.log(`[${username}] - user has signed up [${email}]`);

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: role,
    })
  );
  console.log(`[${username}] - added to ${role} group`);

  const initAuth = await cognito.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: tmpPassword,
      },
    })
  );

  const newPassword = chance.string({ length: 10, password: true });
  await cognito.send(
    new RespondToAuthChallengeCommand({
      ClientId: USER_POOL_CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: initAuth.Session,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: newPassword,
      },
    })
  );

  const auth = await cognito.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: newPassword,
      },
    })
  );
  console.log(`$[${username}] - signed in`);

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
