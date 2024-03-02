const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminConfirmSignUpCommand,
  SignUpCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const chance = require('chance').Chance();
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const { SERVICE_NAME, USER_POOL_ID, USER_POOL_CLIENT_ID } = process.env;
const username = 'test-bot';
const email = `test-bot@${SERVICE_NAME}.dev`;
console.log(
  `[${username}] - creating ['SYS_ADMIN'] user under tenant [${SERVICE_NAME}]`
);

const cognito = new CognitoIdentityProviderClient();
const password = chance.string({
  length: 12,
  pool: 'abcdefghijklmnopqrstuvwxyz',
});

const signUpTestBot = new SignUpCommand({
  ClientId: USER_POOL_CLIENT_ID,
  Username: username,
  MessageAction: 'SUPPRESS',
  Password: password,
  UserAttributes: [
    { Name: 'email', Value: email },
    { Name: 'given_name', Value: 'Test' },
    { Name: 'family_name', Value: 'Bot' },
    { Name: 'custom:tenantId', Value: SERVICE_NAME },
  ],
});

const addToSysAdminGroup = new AdminAddUserToGroupCommand({
  UserPoolId: USER_POOL_ID,
  Username: username,
  GroupName: 'SYS_ADMIN',
});

const confirmTestBotUser = new AdminConfirmSignUpCommand({
  UserPoolId: USER_POOL_ID,
  Username: username,
});

cognito
  .send(signUpTestBot)
  .then(async () => {
    console.log(`[${email}] - user has signed up [${username}]`);

    await cognito.send(addToSysAdminGroup);
    console.log(`[${email}] - added to SYS_ADMIN group`);

    await cognito.send(confirmTestBotUser);
    console.log(`[${email}] - confirmed sign up`);

    const TEST_BOT_PASSWORD = `\nTEST_BOT_PASSWORD=${password}`;
    addEnvVariable(TEST_BOT_PASSWORD);
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
