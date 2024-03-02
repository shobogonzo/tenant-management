const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const tenant_exists_in_DynamoDB = async (tenant) => {
  const ddbClient = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  console.log(
    `looking for tenant [${tenant.id}] in table [${process.env.TENANT_TABLE}]`
  );
  const resp = await docClient.send(
    new GetCommand({
      TableName: process.env.TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenant.id}`,
        SK: `DETAILS#${tenant.name}`,
      },
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

const user_exists_in_DynamoDB = async (username, tenantId) => {
  const ddbClient = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  console.log(
    `looking for user [${username}] under tenant [${tenantId}] in table [${process.env.TENANT_TABLE}]`
  );
  const resp = await docClient.send(
    new GetCommand({
      TableName: process.env.TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: `USER#${username}`,
      },
    })
  );

  expect(resp.Item).toBeTruthy();

  return resp.Item;
};

module.exports = {
  tenant_exists_in_DynamoDB,
  user_exists_in_DynamoDB,
};
