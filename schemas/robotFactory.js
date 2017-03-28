const Duck = require('../modules/duck');

const RobotFactory = Duck({
	Table: 'NoodlesRobotFactories',
	Item: {
		Id: String, // Site Id
		_Id: String,
		name: String,
		schema: [{
			name: String,
			type: String,
			defaultValue: String, // can also be array
			options: Array,
			isList: String,
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

module.exports = RobotFactory;