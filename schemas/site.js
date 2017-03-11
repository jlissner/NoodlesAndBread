const Duck = require('../modules/duck');

const Site = Duck({
	Table: 'NoodlesSites',
	Item: {
		Id: String,
		name: String,
		title: String,
		description: String,
	},
	
	HASH: 'Id',
	HASHType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Site;