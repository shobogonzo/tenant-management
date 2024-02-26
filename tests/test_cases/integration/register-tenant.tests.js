const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const teardown = require('../../steps/teardown');
const chance = require('chance').Chance();

describe('When registerTenant runs', () => {
  let tenant;
  let adminUser;

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_tenant_user(adminUser.username, tenant.id);
  });

  it('The tenant and admin user should be saved in DynamoDB', async () => {
    const tenantName = chance.company();
    const adminFirstName = chance.first({ nationality: 'en' });
    const adminLastName = chance.last({ nationality: 'en' });
    const adminEmail = chance.email();

    const result = await when.we_invoke_registerTenant(
      tenantName,
      adminFirstName,
      adminLastName,
      adminEmail
    );
    tenant = result.tenant;
    adminUser = result.adminUser;

    const ddbTenant = await then.tenant_exists_in_DynamoDB(tenant.id);
    expect(ddbTenant).toMatchObject({
      name: tenantName,
      status: 'ONBOARDING',
    });

    const ddbUser = await then.user_exists_in_DynamoDB(
      adminUser.username,
      tenant.id
    );
    expect(ddbUser).toMatchObject({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      status: 'UNCONFIRMED',
    });
  });
});
