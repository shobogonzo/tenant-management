const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const tenant_exists_in_DynamoDB = async (tenantId) => {
  const ddbClient = new DynamoDBClient();
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  console.log(
    `looking for tenant [${tenantId}] in table [${process.env.TENANT_TABLE}]`
  );
  const resp = await docClient.send(
    new GetCommand({
      TableName: process.env.TENANT_TABLE,
      Key: {
        PK: `TENANT#${tenantId}`,
        SK: 'DETAILS',
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
    `looking for user [${username}] in tenant [${tenantId}] in table [${process.env.TENANT_TABLE}]`
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
