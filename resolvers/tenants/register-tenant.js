export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: {
      arguments: ctx.arguments,
    },
  };
}

export function response(ctx) {
  return {
    ...ctx.result.tenant,
    tenantAdmin: ctx.result.tenantAdmin,
  };
}
