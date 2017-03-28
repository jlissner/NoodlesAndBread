const Duck = require('../modules/duck');

const Robot = Duck({
	Table: 'NoodlesRobots',
	Item: {
		Id: String, // Factory Id
		_Id: String,
		name: String,
		body: String,
		documentation: String,
		parts: [{
			name: String, // What its called when being used in the body
			factory: String,
			isOne: Boolean,
			params: [{
				field: String,
				value: 'Any',
			}]
		}],
	},
	
	HASH: 'Id',
	HASHType: 'S',
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	schemaless: true,
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Robot;