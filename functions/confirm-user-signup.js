/*
    Expected Input
    https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools-working-with-aws-lambda-triggers.html#cognito-user-pools-lambda-trigger-event-parameter-shared

    {
      version: '1',
      triggerSource: 'PostConfirmation_ConfirmSignUp',
      region: 'us-east-1',
      userPoolId: 'us-east-1_XgzZmqL3b',
      userName: 'jboone-asdfas',
      request: {
        userAttributes: {
          sub: '3da239a6-1f47-53aa-8fb0-e1b70ec1d439',
          'cognito:email_alias': 'John-Boone-mrqi@test.com',
          'cognito:user_status': 'CONFIRMED',
          email_verified: 'false',
          firstName: 'John',
          lastName: 'Boone',
          email: 'John-Boone-mrqi@test.com'
          'custom:tenantId': 'asdfasda-asdfasf-asdfas-sdfasfd',
        }
      },
      response: {}
    }
*/

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
      ReturnValues: 'UPDATED_NEW',
    })
  );

  return result;
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
