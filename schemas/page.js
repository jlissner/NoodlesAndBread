const Duck = require('../modules/duck');

const Page = Duck({
	Table: 'NoodlesPages',
	Item: {
		Id: String,
		url: String,
		template: String,
		title: String,
		description: String,
		robots: [{
			id: String,
			home: String,
			paint: String,
			data: [{
				hash: String,
				range: String,
			}],
		}],
	},
	
	HASH: 'Id',
	HASHType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Page;