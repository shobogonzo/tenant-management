export function request(ctx) {
  if (ctx.args.limit >= 25) {
    util.error('Max limit is 25');
  }

  const filter = util.transform.toDynamoDBFilterExpression({
    SK: { beginsWith: 'DETAILS' },
  });

  return {
    operation: 'Scan',
    limit: ctx.args.limit,
    consistentRead: false,
    // exclusiveStartKey: ctx.args.exclusiveStartKey,
    filter: JSON.parse(filter),
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
        status: tenant.status,
        createdAt: tenant.createdAt,
      };
    });
  }
}
