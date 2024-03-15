require('dotenv').config();
const {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const chance = require('chance').Chance();
const { GraphQL, registerFragment } = require('../lib/graphql');

const myProfileFragment = `
fragment myProfileFields on MyProfile {
  username
  firstName
  lastName
  email
  createdAt
}
`;

registerFragment('myProfileFields', myProfileFragment);

const we_invoke_registerTenant = async (
  tenantName,
  adminFirstName,
  adminLastName,
  adminEmail
) => {
  const handler = require('../../functions/register-tenant.js').handler;
  const context = {};
  const event = {
    arguments: {
      newTenant: {
        tenantName,
        adminFirstName,
        adminLastName,
        adminEmail,
      },
    },
  };

  return await handler(event, context);
};

// TODO refactor args
const we_invoke_createCognitoUser = async (
  firstName,
  lastName,
  email,
  password,
  role,
  tenantId
) => {
  const handler = require('../../functions/create-cognito-user.js').handler;
  const context = {};
  const event = {
    arguments: {
      firstName,
      lastName,
      email,
      password,
      role,
      tenantId,
    },
  };

  return await handler(event, context);
};

const we_invoke_registerUserSignup = async (user, role, tenantId) => {
  const { username, firstName, lastName, email } = user;
  const handler = require('../../functions/register-user-signup.js').handler;
  const context = {};
  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.USER_POOL_ID,
    userName: username,
    triggerSource: 'PreSignUp_AdminCreateUser',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'FORCE_CHANGE_PASSWORD',
        email_verified: 'false',
        given_name: firstName,
        family_name: lastName,
        email: email,
        'custom:tenantId': tenantId,
      },
      clientMetadata: { role },
    },
    response: {},
  };

  console.log(
    `[${username}] - registering user signup for tenant [${tenantId}]`
  );
  return await handler(event, context);
};

const we_invoke_sendConfirmationEmail = async (user, tenantId) => {
  const { username, firstName, lastName, email } = user;
  const handler = require('../../functions/send-confirmation-email.js').handler;
  const context = {};
  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.USER_POOL_ID,
    userName: username,
    triggerSource: 'CustomMessage_AdminCreateUser',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'FORCE_CHANGE_PASSWORD',
        email_verified: 'false',
        given_name: firstName,
        family_name: lastName,
        email: email,
        'custom:tenantId': tenantId,
      },
    },
    response: {},
  };

  console.log(`[${username}] - sending confirmation email`);
  return await handler(event, context);
};

const we_invoke_confirmUserSignup = async (
  username,
  firstName,
  lastName,
  email
) => {
  const handler = require('../../functions/confirm-user-signup.js').handler;
  const context = {};
  const event = {
    version: '1',
    region: process.env.AWS_REGION,
    userPoolId: process.env.USER_POOL_ID,
    userName: username,
    triggerSource: 'PostConfirmation_ConfirmSignUp',
    request: {
      userAttributes: {
        sub: username,
        'cognito:email_alias': email,
        'cognito:user_status': 'CONFIRMED',
        email_verified: 'true',
        given_name: firstName,
        family_name: lastName,
        email: email,
        'custom:tenantId': chance.guid(),
      },
    },
    response: {},
  };

  return await handler(event, context);
};

const sysadmin_registers_tenant = async (
  sysadmin,
  tenantName,
  adminFirstName,
  adminLastName,
  adminEmail
) => {
  const registerTenant = `mutation registerTenant($newTenant: RegisterTenantInput!) {
    registerTenant(newTenant: $newTenant) {
      tenant {
        id
        name
        status
        createdAt
      }
      tenantAdmin {
        username
        firstName
        lastName
        email
      }
    }
  }`;

  const variables = {
    newTenant: {
      tenantName,
      adminFirstName,
      adminLastName,
      adminEmail,
    },
  };

  const data = await GraphQL(
    process.env.API_URL,
    registerTenant,
    variables,
    sysadmin.accessToken
  );
  const result = data.registerTenant;
  if (!result) {
    throw new Error('Tenant registration failed');
  }

  console.log('registerTenant', result);

  return result;
};

module.exports = {
  we_invoke_registerTenant,
  we_invoke_createCognitoUser,
  we_invoke_registerUserSignup,
  we_invoke_sendConfirmationEmail,
  we_invoke_confirmUserSignup,
  sysadmin_registers_tenant,
};
