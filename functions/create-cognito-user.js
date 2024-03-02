const middy = require('@middy/core');
const {
  Logger,
  injectLambdaContext,
} = require('@aws-lambda-powertools/logger');
const {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} = require('@aws-sdk/client-cognito-identity-provider');
const chance = require('chance').Chance();

const { SERVICE_NAME, USER_POOL_ID } = process.env;
const logger = new Logger({ serviceName: SERVICE_NAME });

// DynamoDB streams event
const lambdaHandler = async (event) => {
  const { firstName, lastName, email, role, username, tenantId } =
    event.arguments;

  logger.info(
    `[${username}] - creating user account under tenant [${tenantId}]`
  );

  const cognito = new CognitoIdentityProviderClient();
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: chance.string({ length: 10 }),
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:tenantId', Value: tenantId },
      ],
    })
  );
  logger.info(`[${email}] - user has signed up [${username}]`);

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      GroupName: role,
    })
  );
  logger.info(`[${email}] - added to ${role} group`);

  return event;
};

module.exports.handler = middy()
  .use(injectLambdaContext(logger))
  .handler(lambdaHandler);
