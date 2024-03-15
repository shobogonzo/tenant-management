const given = require('../../steps/given');
const when = require('../../steps/when');
const then = require('../../steps/then');
const teardown = require('../../steps/teardown');
const chance = require('chance').Chance();

describe('When registerUserSignup runs', () => {
  let tenant;
  let user;

  beforeAll(async () => {
    tenant = await given.an_existing_tenant(chance.guid(), chance.company());
    user = given.a_random_user();
    user.username = 'test-user-beepboop';
    role = 'TENANT_ADMIN';
    await when.we_invoke_registerUserSignup(user, role, tenant.id);
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(user.username, tenant.id);
  });

  it("The user should be saved in 'Pending' status", async () => {
    const ddbUser = await then.user_exists_in_DynamoDB(
      user.username,
      tenant.id
    );

    expect(ddbUser).toMatchObject({
      PK: `TENANT#${tenant.id}`,
      SK: `USER#${user.username}`,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: role,
      status: 'PENDING',
      createdAt: expect.stringMatching(
        /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?Z?/g
      ),
    });
  });
});
