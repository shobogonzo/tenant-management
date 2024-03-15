const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const teardown = require('../../steps/teardown');
const chance = require('chance').Chance();

describe('When a sysadmin registers a tenant', () => {
  let sysadmin;
  let tenant;
  let tenantAdmin;

  beforeAll(async () => {
    sysadmin = await given.an_authenticated_user('SYS_ADMIN');
    const tenantName = chance.company();
    const adminUser = given.a_random_user();

    const response = await when.sysadmin_registers_tenant(
      sysadmin,
      tenantName,
      adminUser.firstName,
      adminUser.lastName,
      adminUser.email
    );

    tenant = {
      id: response.tenant.id,
      name: response.tenant.name,
      status: response.tenant.status,
      createdAt: response.tenant.createdAt,
    };

    tenantAdmin = response.tenantAdmin;
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(tenantAdmin.username, tenant.id, true);
    await teardown.a_user(sysadmin.username, process.env.SERVICE_NAME, true);
  });

  it('The tenant should be initialized in "Onboarding" status', async () => {
    const ddbTenant = await then.tenant_exists_in_DynamoDB(tenant);

    expect(ddbTenant).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `DETAILS`,
      id: tenant.id,
      name: tenant.name,
      status: 'ONBOARDING',
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
    });
  });

  it('The tenant admin user should be initialized in "Pending" status', async () => {
    const { firstName, lastName, email, username } = tenantAdmin;

    await then.user_exists_in_Cognito(username, tenant.id);
    await then.user_belongs_to_CognitoGroup(username, 'TENANT_ADMIN');

    const ddbTenantAdmin = await then.user_exists_in_DynamoDB(
      username,
      tenant.id
    );

    expect(ddbTenantAdmin).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `USER#${username}`,
      username,
      firstName,
      lastName,
      email,
      status: 'PENDING',
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
    });
  });

  describe('When the tenant admin verifies their email', () => {});
});
