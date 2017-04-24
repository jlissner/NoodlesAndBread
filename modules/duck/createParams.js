module.exports = (Duck) => {
	Duck.createParams = (method, data) => {
		const table = data.table;
		const hash = data.hash;
		const range = data.range;
		const query = data.query;
		const params = {
			TableName: table,
		};

		switch (method) {
			case 'add': {

				break;
			}
			case 'delete': {
				
				break;
			}
			case 'update': {
				
				break;
			}
			case 'scan': {
				break;
			}
			case 'get': {
				params.Key = {};
				
				params.Key[hash] = query[hash];

				if(range) {
					params.Key[range] = query[range];
				}

				break;
			}
			case 'query':
			default: {
				params.ExpressionAttributeNames = {};
				params.ExpressionAttributeValues = {};

				params.KeyConditionExpression = `#${hash} = :${hash}`;
				params.ExpressionAttributeNames[`#${hash}`] = hash;
				params.ExpressionAttributeValues[`:${hash}`] = query[hash];

				if(range && query[range]) {
					params.KeyConditionExpression += ` and #${range} = :${range}`;
					params.ExpressionAttributeNames[`#${range}`] = range;
					params.ExpressionAttributeValues[`:${range}`] = query[range];
				}
			}
		}

		return params;
	}
}