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
    user = given.a_random_user();
  });

  afterAll(async () => {
    await teardown.a_tenant(tenant);
    await teardown.a_user(user.username, tenant.id, true);
  });

  it('The user should have tenant ID custom claim', async () => {
    const role = 'TENANT_ADMIN';
    // TODO pull into beforeAll
    const result = await when.we_invoke_createCognitoUser(
      user.firstName,
      user.lastName,
      user.email,
      user.password,
      role,
      tenant.id
    );

    expect(result).toMatchObject({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role,
      username: expect.stringMatching(
        new RegExp(
          `^${user.firstName[0]}${user.lastName.slice(0, 8)}`.toLowerCase()
        )
      ),
      tenantId: tenant.id,
    });

    const cognitoUser = await then.user_exists_in_Cognito(result.username);
    user.username = cognitoUser.Username;

    expect(
      cognitoUser.UserAttributes.some((attr) => {
        return attr.Name === 'custom:tenantId' && attr.Value === tenant.id;
      })
    ).toBeTruthy();
  });

  it('The user should be assigned to the correct role-based group', async () => {
    await then.user_belongs_to_CognitoGroup(user.username, 'TENANT_ADMIN');
  });
});
