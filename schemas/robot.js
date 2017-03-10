const Duck = require('../modules/duck');

const Robot = Duck({
	Table: 'NoodlesRobots',
	Item: {
		Id: String,
		name: String,
		body: String, // view
		brain: String, // controller
	},
	
	HASH: 'Id',
	HASHType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Robot;