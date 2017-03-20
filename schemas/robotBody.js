const Duck = require('../modules/duck');

const RobotBody = Duck({
	Table: 'NoodlesRobotBodies',
	Item: {
		Id: String,
		_Id: String,
		name: String,
		factory: String,
		body: String,
	},
	
	HASH: 'Id',
	HASHType: 'S',
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = RobotBody;