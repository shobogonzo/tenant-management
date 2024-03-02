const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DeleteCommand,
  DynamoDBDocumentClient,
} = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const a_tenant = async (tenant) => {
  await docClient.send(
    new DeleteCommand({
      TableName: process.env.TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: `DETAILS#${tenant.name}`,
      },
    })
  );
  console.log(`[${tenant.id}] - tenant deleted`);
};

const a_user = async (username, tenantId) => {
  if (!username || !tenantId) {
    throw new Error('username and tenantId required');
  }
  console.log(`[${username}] - deleting user from tenant [${tenantId}]`);

  await docClient.send(
    new DeleteCommand({
      TableName: process.env.TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
      },
    })
  );
  console.log(`[${username}] - user deleted from tenant [${tenantId}]`);

  // TODO remove from cognito
};

module.exports = {
  a_tenant,
  a_user,
};
