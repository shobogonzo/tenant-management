import { get } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  return get({
    key: {
      PK: `TENANT#${ctx.args.id}`,
      SK: 'DETAILS',
    },
  });
}

export function response(ctx) {
  return {
    id: ctx.result.PK.split('#')[1],
    name: ctx.result.name,
    status: ctx.result.status,
    createdAt: ctx.result.createdAt,
  };
}
