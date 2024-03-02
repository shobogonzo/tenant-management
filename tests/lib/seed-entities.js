import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
const dynamodb = new DynamoDB({ region: 'us-east-1' });
const dynamodbClient = DynamoDBDocumentClient.from(dynamodb);
import 'dotenv/config';
import { Chance } from 'chance';
const chance = new Chance();

const entities = [
  { PK: `ENTITY#${chance.guid()}`, name: 'Mac' },
  { PK: `ENTITY#${chance.guid()}`, name: 'Dennis' },
  { PK: `ENTITY#${chance.guid()}`, name: 'Charlie' },
  { PK: `ENTITY#${chance.guid()}`, name: 'De' },
  { PK: `ENTITY#${chance.guid()}`, name: 'Frank' },
];

const putRequests = entities.map((entity) => ({
  PutRequest: {
    Item: entity,
  },
}));

const command = new BatchWriteCommand({
  RequestItems: {
    [process.env.SHOBO_TABLE]: putRequests,
  },
});

dynamodbClient
  .send(command)
  .then(() => console.log('entities seeded'))
  .catch((err) => console.error(err));
