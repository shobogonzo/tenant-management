export function request(ctx) {
  const { tenantName, adminFirstName, adminLastName, adminEmail } =
    ctx.args.newTenant;

  if (!tenantName) {
    util.error('tenantName is required');
  }
  if (!adminFirstName) {
    util.error('adminFirstName is required');
  }
  if (!adminLastName) {
    util.error('adminLastName is required');
  }
  if (!adminEmail) {
    util.error('adminEmail is required');
  }

  const tenantId = util.autoId();
  const tenant = { id: tenantId, name: tenantName, status: 'ONBOARDING' };

  ctx.stash.user = {
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail,
    role: 'TENANT_ADMIN',
    tenantId,
  };

  return tenant;
}

export function response(ctx) {
  return {
    tenant: ctx.stash.tenant,
    tenantAdmin: ctx.prev.result,
  };
}
