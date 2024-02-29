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
  const { tenantName, adminFirstName, adminLastName, adminEmail } =
    event.arguments;

  const tenant = {
    id: uuid(),
    name: tenantName,
    status: 'ONBOARDING',
  };
  logger.info(tenant);

  const adminFirstInitial = adminFirstName.charAt(0);
  const suffix = chance.string({
    length: 6,
    pool: 'abcdefghijklmnopqrstuvwxyz',
  });
  let username = `${adminFirstInitial}${adminLastName}-${suffix}`;
  username = username.toLowerCase();

  const tenantAdmin = {
    username,
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail,
    status: 'CREATING',
  };
  logger.info(tenantAdmin);

  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TENANT_TABLE,
            Item: {
              PK: `TENANT#${tenant.id}`,
              SK: `DETAILS#${tenant.name}`,
              ...tenant,
              createdAt: new Date().toJSON(),
            },
          },
        },
        {
          Put: {
            TableName: TENANT_TABLE,
            Item: {
              PK: `TENANT#${tenant.id}`,
              SK: `USER#${username}`,
              ...tenantAdmin,
              createdAt: new Date().toJSON(),
            },
          },
        },
      ],
    })
  );

  return { tenant, tenantAdmin };
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
