const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminConfirmSignUpCommand,
  SignUpCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const dynamodb = new DynamoDB({ region: 'us-east-1' });
const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
const chance = require('chance').Chance();
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const {
  SERVICE_NAME,
  ROOT_DOMAIN,
  USER_POOL_ID,
  USER_POOL_CLIENT_ID,
  TENANT_TABLE,
} = process.env;
const username = 'root-user';
const email = `root-user@${ROOT_DOMAIN}`;
console.log(
  `[${username}] - creating ['SYS_ADMIN'] user under tenant [${SERVICE_NAME}]`
);

const cognito = new CognitoIdentityProviderClient();
const password = chance.string({
  length: 12,
  pool: 'abcdefghijklmnopqrstuvwxyz',
});

const signUpRootUser = new SignUpCommand({
  ClientId: USER_POOL_CLIENT_ID,
  Username: username,
  Password: password,
  UserAttributes: [
    { Name: 'email', Value: email },
    { Name: 'given_name', Value: 'Root' },
    { Name: 'family_name', Value: 'User' },
    { Name: 'custom:tenantId', Value: SERVICE_NAME },
  ],
  ClientMetadata: {
    role: 'SYS_ADMIN',
  },
});

const addToSysAdminGroup = new AdminAddUserToGroupCommand({
  UserPoolId: USER_POOL_ID,
  Username: username,
  GroupName: 'SYS_ADMIN',
});

const confirmRootUser = new AdminConfirmSignUpCommand({
  UserPoolId: USER_POOL_ID,
  Username: username,
});

const getConfirmation = new ScanCommand({
  TableName: TENANT_TABLE,
  FilterExpression: 'SK = :sk',
  ExpressionAttributeValues: {
    ':sk': `TENANT#${SERVICE_NAME}#USER#${username}`,
  },
});

cognito
  .send(signUpRootUser)
  .then(async () => {
    console.log(`[${email}] - user has signed up [${username}]`);

    await cognito.send(addToSysAdminGroup);
    console.log(`[${email}] - added to SYS_ADMIN group`);

    await cognito.send(confirmRootUser);
    const result = await dynamodbClient.send(getConfirmation);
    const confirmation = result.Items[0];
    await dynamodbClient.send(
      new DeleteCommand({
        TableName: TENANT_TABLE,
        Key: {
          PK: confirmation.PK,
          SK: confirmation.SK,
        },
      })
    );
    console.log(`[${email}] - confirmed sign up`);

    const ROOT_USER_PASSWORD = `\nROOT_USER_PASSWORD=${password}`;
    addEnvVariable(ROOT_USER_PASSWORD);
  })
  .catch((err) => console.log(err));

function addEnvVariable(variable) {
  fs.readFile(envPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading .env file', err);
      return;
    }

    const newData = data + variable;
    fs.writeFile(envPath, newData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to .env file', err);
        return;
      }
      console.log('Environment variable added successfully');
    });
  });
}
