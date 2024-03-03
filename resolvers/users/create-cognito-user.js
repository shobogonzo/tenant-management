export function request(ctx) {
  const { firstName, lastName, email, role, tenantId } = ctx.stash.user;

  return {
    operation: 'Invoke',
    payload: {
      arguments: {
        firstName,
        lastName,
        email,
        role,
        tenantId,
      },
    },
  };
}

export function response(ctx) {
  return ctx.result;
}
