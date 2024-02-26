const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  TransactWriteCommand,
  DynamoDBDocumentClient,
} = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const middy = require('@middy/core');
const {
  Logger,
  injectLambdaContext,
} = require('@aws-lambda-powertools/logger');
const { v4: uuid } = require('uuid');
const chance = require('chance').Chance();

const { SERVICE_NAME, TENANT_TABLE } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });

const lambdaHandler = async (event) => {
  const tenantId = uuid();
  const tenant = {
    id: tenantId,
    name: event.tenantName,
    status: 'ONBOARDING',
  };
  logger.info(tenant);

  const { adminFirstName, adminLastName, adminEmail } = event;
  const adminFirstInitial = adminFirstName.charAt(0);
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  let username = `${adminFirstInitial}${adminLastName}-${suffix}`;
  username = username.toLowerCase();

  const adminUser = {
    username,
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail,
    status: 'UNCONFIRMED',
  };
  logger.info(adminUser);

  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TENANT_TABLE,
            Item: {
              PK: `TENANT#${tenantId}`,
              SK: 'DETAILS',
              ...tenant,
              createdAt: new Date().toJSON(),
            },
          },
        },
        {
          Put: {
            TableName: TENANT_TABLE,
            Item: {
              PK: `TENANT#${tenantId}`,
              SK: `USER#${username}`,
              ...adminUser,
              createdAt: new Date().toJSON(),
            },
          },
        },
      ],
    })
  );

  return { tenant, adminUser };
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
