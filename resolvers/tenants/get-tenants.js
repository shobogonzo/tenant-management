export function request(ctx) {
  if (ctx.args.limit >= 25) {
    util.error('Max limit is 25');
  }

  return {
    operation: 'Scan',
    limit: util.dynamodb.toDynamoDB(ctx.args.limit),
    nextToken: ctx.args.nextToken,
    consistentRead: false,
    scanIndexForward: false,
    select: 'ALL_ATTRIBUTES',
  };
}

export function response(ctx) {
  if (ctx.result.items.length == 0) {
    return [];
  } else {
    return ctx.result.items.map((tenant) => {
      return {
        id: tenant.PK.split('#')[1],
        name: tenant.name,
        createdAt: tenant.createdAt,
      };
    });
  }
}
