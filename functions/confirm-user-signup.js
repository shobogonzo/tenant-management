// https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html#cognito-user-pools-lambda-trigger-event-parameter-shared
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
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
    return event;
  }

  const tenantId = event.request.userAttributes['custom:tenantId'];
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TENANT_TABLE,
      Key: { PK: `TENANT#${tenantId}`, SK: `USER#${event.userName}` },
      UpdateExpression: 'set #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'ACTIVE' },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );
  logger.info(result);

  return event;
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
