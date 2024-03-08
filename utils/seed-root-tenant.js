const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const dynamodb = new DynamoDB({ region: 'us-east-1' });
const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
require('dotenv').config();

const { SERVICE_NAME, ROOT_DOMAIN, TENANT_TABLE } = process.env;

const tenant = {
  PK: `TENANT#${SERVICE_NAME}`,
  SK: `DETAILS#${SERVICE_NAME}`,
  name: 'Root Tenant',
  status: 'ACTIVE',
  createdAt: new Date().toJSON(),
};

const testbot = {
  PK: `TENANT#${SERVICE_NAME}`,
  SK: 'USER#test-bot',
  firstName: 'Test',
  lastName: 'Bot',
  email: `test-bot@${ROOT_DOMAIN}`,
  role: 'SYS_ADMIN',
  status: 'ACTIVE',
  createdAt: new Date().toJSON(),
};

const command = new BatchWriteCommand({
  RequestItems: {
    [TENANT_TABLE]: [
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
