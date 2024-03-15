const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const dynamodb = new DynamoDB({ region: 'us-east-1' });
const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
require('dotenv').config();

const { SERVICE_NAME, TENANT_TABLE } = process.env;

const tenant = {
  PK: `TENANT#${SERVICE_NAME}`,
  SK: `DETAILS`,
  name: 'Root Tenant',
  status: 'ACTIVE',
  createdAt: new Date().toJSON(),
};

const command = new PutCommand({
  TableName: TENANT_TABLE,
  Item: tenant,
});

dynamodbClient
  .send(command)
  .then(() => console.log('root tenant seeded'))
  .catch((err) => console.error(err));
