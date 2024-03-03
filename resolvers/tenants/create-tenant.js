import { put } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  const { id, name, status } = ctx.prev.result;
  if (!id) {
    util.error('Tenant ID is required');
  }
  if (!name) {
    util.error('Tenant name is required');
  }
  if (!status) {
    util.error('Tenant status is required');
  }

  return put({
    key: { PK: `TENANT#${id}`, SK: 'DETAILS' },
    item: {
      id,
      name,
      status,
      createdAt: util.time.nowISO8601(),
    },
  });
}

export function response(ctx) {
  ctx.stash.tenant = {
    id: ctx.result.id,
    name: ctx.result.name,
    status: ctx.result.status,
    createdAt: ctx.result.createdAt,
  };
  return ctx.result;
}
