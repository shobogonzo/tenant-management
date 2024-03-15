const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const teardown = require('../../steps/teardown');
const chance = require('chance').Chance();

describe('When sendConfirmationEmail runs', () => {
  let tenant;
  let user;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.company(), 'ACTIVE');
    user = await given.an_existing_user('TENANT_ADMIN', 'PENDING', tenant.id);
    await when.we_invoke_sendConfirmationEmail(user, tenant.id);
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(user.username, tenant.id);
  });

  it('The confirmation token should be saved in DynamoDB', async () => {
    const confirmation = await then.user_confirmation_exists_in_DynamoDB(
      user.username,
      tenant.id
    );
    expect(confirmation).toBeTruthy();

    const now = Math.floor(Date.now() / 1000);
    const eightDaysFromNow = now + 8 * 24 * 60 * 60;
    expect(typeof confirmation.expireAt).toBe('number');
    expect(confirmation.expireAt).toBeGreaterThan(now);
    expect(confirmation.expireAt).toBeLessThan(eightDaysFromNow);

    expect(confirmation).toMatchObject({
      PK: expect.stringMatching(/^CONFIRMATION#/),
      SK: `TENANT#${tenant.id}#USER#${user.username}`,
      username: user.username,
      userPoolId: process.env.USER_POOL_ID,
    });
  });
});
