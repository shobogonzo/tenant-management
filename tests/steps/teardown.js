const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
} = require('@aws-sdk/lib-dynamodb');
const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);
const {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} = require('@aws-sdk/client-cognito-identity-provider');
const cognito = new CognitoIdentityProviderClient();

const { TENANT_TABLE, USER_POOL_ID } = process.env;

const a_tenant = async (tenant) => {
  await docClient.send(
    new DeleteCommand({
      TableName: TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: `DETAILS#${tenant.name}`,
      },
    })
  );
  console.log(`[${tenant.id}] - tenant deleted`);
};

const a_user = async (username, tenantId, deleteFromCognito) => {
  if (!username || !tenantId) {
    throw new Error('username and tenantId required');
  }
  console.log(`[${username}] - deleting user from tenant [${tenantId}]`);
  await docClient.send(
    new DeleteCommand({
      TableName: TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
      },
    })
  );
  console.log(`[${username}] - user deleted from tenant [${tenantId}]`);

  if (deleteFromCognito) {
    console.log(
      `[${username}] - deleting user from user pool [${USER_POOL_ID}]`
    );
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );
    console.log(
      `[${username}] - user deleted from user pool [${USER_POOL_ID}]`
    );
  }
};

module.exports = {
  a_tenant,
  a_user,
};
