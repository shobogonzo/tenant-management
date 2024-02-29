const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const teardown = require('../../steps/teardown');
const chance = require('chance').Chance();

describe('When createCognitoUser runs', () => {
  let tenant;
  let user;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.guid(), chance.company());
    user = await given.an_existing_user('TENANT_ADMIN', 'CREATING', tenant.id);
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(user.username, tenant.id);
  });

  it('The user account should belong to the TENANT_ADMIN group', async () => {
    const password = chance.string({ length: 10, password: true });
    const role = 'TENANT_ADMIN';

    const result = await when.we_invoke_createCognitoUser(
      user.firstName,
      user.lastName,
      user.email,
      password,
      role,
      user.username,
      tenant.id
    );
  });
});
