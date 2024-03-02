import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'GetItem',
    key: {
      PK: util.dynamodb.toDynamoDB(`TENANT#${ctx.args.id}`),
      SK: 'DETAILS',
    },
  };
}

export function response(ctx) {
  return {
    id: ctx.result.PK.split('#')[1],
    name: ctx.result.name,
    status: ctx.result.status,
    createdAt: ctx.result.createdAt,
  };
}
