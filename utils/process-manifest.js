const _ = require('lodash');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

/*
Pulls output values from the CF stack into a .env file 
for local dev and CICD testing
*/
module.exports = async function processManifest(manifestData) {
  const stageName = Object.keys(manifestData);
  const { outputs } = manifestData[stageName];

  const getOutputValue = (key) => {
    console.log(`loading output value for [${key}]`);
    const output = _.find(outputs, (x) => x.OutputKey === key);
    if (!output) {
      throw new Error(`No output found for ${key}`);
    }
    return output.OutputValue;
  };

  const dotEnvFile = path.resolve('.env');
  await updateDotEnv(dotEnvFile, {
    SERVICE_NAME: getOutputValue('ServiceName'),
    TENANT_TABLE: getOutputValue('TenantTable'),
    USER_POOL_ID: getOutputValue('UserPoolId'),
    USER_POOL_CLIENT_ID: getOutputValue('UserPoolClientId'),
    API_URL: getOutputValue('GraphQlApiUrl'),
  });
};

async function updateDotEnv(filePath, env) {
  // Merge with existing values in the .env file
  try {
    const existing = dotenv.parse(
      await promisify(fs.readFile)(filePath, 'utf-8')
    );
    env = Object.assign(existing, env);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  const contents = Object.keys(env)
    .map((key) => format(key, env[key]))
    .join('\n');
  await promisify(fs.writeFile)(filePath, contents);

  return env;
}

function escapeNewlines(str) {
  return str.replace(/\n/g, '\\n');
}

function format(key, value) {
  return `${key}=${escapeNewlines(value)}`;
}
