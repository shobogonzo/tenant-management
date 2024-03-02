const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  UpdateCommand,
  DynamoDBDocumentClient,
} = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const middy = require('@middy/core');
const {
  Logger,
  injectLambdaContext,
} = require('@aws-lambda-powertools/logger');

const { SERVICE_NAME, TENANT_TABLE } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });

const lambdaHandler = async (event) => {
  if (event.triggerSource !== 'CustomMessage_AdminCreateUser') {
    return event;
  }

  // TODO send an email via SES containing a link that will trigger the confirm-user-signup.js Lambda

  return event;
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
