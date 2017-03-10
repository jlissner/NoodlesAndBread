const Duck = require('../modules/duck');

const Data = Duck({
	Table: 'NoodlesData',
	Item: {
		Id: String,
		_Id: String,
	},
	
	HASH: 'Id',
	HASHType: 'S',
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	schemaless: true,
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Data;