const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const middy = require('@middy/core');
const {
  Logger,
  injectLambdaContext,
} = require('@aws-lambda-powertools/logger');
const { ulid } = require('ulid');

const { SERVICE_NAME, ROOT_DOMAIN, TENANT_TABLE } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });

const lambdaHandler = async (event, context) => {
  if (
    event.triggerSource !== 'CustomMessage_SignUp' &&
    event.triggerSource !== 'CustomMessage_AdminCreateUser'
  ) {
    return event;
  }

  const token = ulid();
  const expireAt = Math.floor(
    (new Date().getTime() + 7 * 24 * 60 * 60 * 1000) / 1000
  );

  try {
    const tenantId = event.request.userAttributes['custom:tenantId'];
    await docClient.send(
      new PutCommand({
        TableName: TENANT_TABLE,
        Item: {
          PK: `CONFIRMATION#${token}`,
          SK: `TENANT#${tenantId}#USER#${event.userName}`,
          username: event.userName,
          userPoolId: event.userPoolId,
          createdAt: new Date().toISOString(),
          expireAt,
        },
      })
    );
    logger.info(
      `[${tenantId}] - created confirmation token for user [${event.userName}]`,
      token
    );

    const message = `Welcome! Please confirm your email address by clicking <a href="https://auth.${ROOT_DOMAIN}/confirm-signup?t=${token}&c=${event.request.codeParameter}">here</a>.`;
    event.response.smsMessage = message;
    event.response.emailMessage = message;
    event.response.emailSubject = 'Welcome to Shobogonzo';

    logger.info(`[${tenantId}] - sending custom message`, event.response);
  } catch (error) {
    logger.critical('Failed to send confirmation email', error);
    throw error;
  } finally {
    return event;
  }
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
