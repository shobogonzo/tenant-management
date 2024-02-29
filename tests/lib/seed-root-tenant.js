const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const dynamodb = new DynamoDB({ region: 'us-east-1' });
const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
require('dotenv').config();

const tenant = {
  PK: `TENANT#${process.env.SERVICE_NAME}`,
  SK: `DETAILS#${process.env.SERVICE_NAME}`,
  name: 'Root Tenant',
};

const testbot = {
  PK: `TENANT#${process.env.SERVICE_NAME}`,
  SK: 'USER#test-bot',
};

const command = new BatchWriteCommand({
  RequestItems: {
    [process.env.TENANT_TABLE]: [
      {
        PutRequest: {
          Item: tenant,
          ConditionExpression: 'attribute_not_exists(PK)',
        },
      },
      {
        PutRequest: {
          Item: testbot,
          ConditionExpression: 'attribute_not_exists(PK)',
        },
      },
    ],
  },
});

dynamodbClient
  .send(command)
  .then(() => console.log('root tenant seeded'))
  .catch((err) => console.error(err));
