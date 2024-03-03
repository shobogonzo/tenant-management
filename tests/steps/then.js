const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const ddbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddbClient);
const cognito = new CognitoIdentityProviderClient();

const { TENANT_TABLE, USER_POOL_ID } = process.env;

const tenant_exists_in_DynamoDB = async (tenant) => {
  console.log(`looking for tenant [${tenant.id}] in table [${TENANT_TABLE}]`);
  const resp = await docClient.send(
    new GetCommand({
      TableName: TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: 'DETAILS',
      },
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

const user_exists_in_DynamoDB = async (username, tenantId) => {
  console.log(
    `looking for user [${username}] under tenant [${tenantId}] in table [${TENANT_TABLE}]`
  );
  const resp = await docClient.send(
    new GetCommand({
      TableName: TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
      },
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

const user_exists_in_Cognito = async (username) => {
  console.log(`looking for user [${username}] in user pool [${USER_POOL_ID}]`);
  const resp = await cognito.send(
    new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    })
  );

  expect(resp.Username).toBeTruthy();

  return resp;
};

const user_belongs_to_CognitoGroup = async (username, group) => {
  console.log(
    `looking for user [${username}] in group [${group}] in user pool [${USER_POOL_ID}]`
  );
  const resp = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    })
  );

  expect(resp.Groups).toBeTruthy();
  expect(resp.Groups.some((g) => g.GroupName === group)).toBeTruthy();

  return resp;
};

module.exports = {
  tenant_exists_in_DynamoDB,
  user_exists_in_DynamoDB,
  user_exists_in_Cognito,
  user_belongs_to_CognitoGroup,
};
