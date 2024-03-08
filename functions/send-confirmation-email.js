const middy = require('@middy/core');
const sts = require('@middy/sts');
const {
  Logger,
  injectLambdaContext,
} = require('@aws-lambda-powertools/logger');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { ulid } = require('ulid');

const { SERVICE_NAME, ROOT_DOMAIN, SERVICE_ROLE_ARN, TENANT_TABLE } =
  process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const lambdaHandler = async (event, context) => {
  if (event.triggerSource !== 'CustomMessage_AdminCreateUser') {
    return event;
  }

  const token = ulid();
  const expireAt = Math.floor(
    (new Date().getTime() + 7 * 24 * 60 * 60 * 1000) / 1000
  );
  event.clientMetadata = { token, expireAt };

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

    const ses = new SESClient({
      credentials: {
        accessKeyId: context.assumeRole.accessKeyId,
        secretAccessKey: context.assumeRole.secretAccessKey,
        sessionToken: context.assumeRole.sessionToken,
      },
    });
    await ses.send(
      new SendEmailCommand({
        Source: `noreply@${ROOT_DOMAIN}`,
        Destination: {
          ToAddresses: [event.request.userAttributes.email],
        },
        Message: {
          Subject: {
            Charset: 'UTF-8',
            Data: 'Shobo account - confirm your email address',
          },
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: `<p>Please confirm your email address by clicking <a href="https://auth.${ROOT_DOMAIN}/confirm-signup?t=${token}">here</a>.</p>`,
            },
          },
        },
      })
    );
    logger.info(
      `[${tenantId}] - sent confirmation email to user [${event.userName}]`
    );

    return event;
  } catch (error) {
    logger.critical('Failed to send confirmation email', error);
    throw error;
  }
};

module.exports.handler = middy()
  .use(
    sts({
      setToContext: true,
      fetchData: {
        assumeRole: {
          RoleArn: SERVICE_ROLE_ARN,
          RoleSessionName: `${SERVICE_NAME}-sendConfirmationEmail`,
        },
      },
    })
  )
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
