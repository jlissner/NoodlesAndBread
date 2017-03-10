const Duck = require('../modules/duck');

const RobotFactory = Duck({
	Table: 'NoodlesRobotFactories',
	Item: {
		Id: String,
		name: String,
		schema: [{
			name: String,
			type: String,
			id: String, // id of other robot, only used when type === "Robot"
		}],
	},
	
	HASH: 'Id',
	HASHType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = RobotFactory;