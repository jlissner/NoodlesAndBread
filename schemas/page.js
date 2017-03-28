const Duck = require('../modules/duck');

const Page = Duck({
	Table: 'NoodlesPages',
	Item: {
		Id: String, // Site Id
		_Id: String,
		url: String,
		layout: String,
		name: String,
		title: String,
		description: String,
		robots: [{
			Id: String, // robot _Id
			home: String,
		}],
	},
	
	HASH: 'Id',
	HASHType: 'S',
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Page;