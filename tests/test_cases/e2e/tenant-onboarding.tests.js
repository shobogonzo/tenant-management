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

    console.log(JSON.stringify(response, null, 2));

    tenant = {
      id: response.id,
      name: response.name,
      status: response.status,
      createdAt: response.createdAt,
    };

    tenantAdmin = response.tenantAdmin;
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(tenantAdmin.username, tenant.id);
    await teardown.a_user(sysadmin.username, process.env.SERVICE_NAME);
  });

  it('The tenant should be initialized in "Onboarding" status', async () => {
    const ddbTenant = await then.tenant_exists_in_DynamoDB(tenant);

    expect(ddbTenant).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `DETAILS#${tenant.name}`,
      id: tenant.id,
      name: tenant.name,
      status: 'ONBOARDING',
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
    });
  });

  it('The tenant admin user should be initialized in "Creating" status', async () => {
    const { username, firstName, lastName, email } = tenantAdmin;

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
      role: 'TENANT_ADMIN',
      status: 'CREATING',
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
    });
  });

  describe('When the tenant admin Cognito user has been created', () => {
    // let tenantAdmin;
    // beforeAll(async () => {
    //   tenantAdmin = await when.tenant_admin_created(tenant);
    // });
    // it('The tenant admin should be initialized in "Creating" status', async () => {
    //   const ddbTenantAdmin = await then.user_exists_in_DynamoDB(
    //     tenantAdmin.username,
    //     tenant.id
    //   );
    //   expect(ddbTenantAdmin).toMatchObject({
    //     PK: `TENANT_ADMIN#${tenantAdmin.username}`,
    //     status: 'CREATING',
    //     createdAt: expect.stringMatching(
    //       /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
    //     ),
    //   });
    // });
    // it('The tenant admin should be able to login', async () => {
    //   await when.tenant_admin_logs_in(
    //     tenantAdmin.username,
    //     tenantAdmin.password
    //   );
    // });
    // it('The tenant admin should be able to confirm the email', async () => {
    //   await when.tenant_admin_confirms_
  });
});
