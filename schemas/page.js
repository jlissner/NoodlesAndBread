const Duck = require('../modules/duck');

const Page = Duck({
	Table: 'NoodlesPages',
	Item: {
		Id: String,
		_Id: String,
		url: String,
		layout: String,
		name: String,
		title: String,
		description: String,
		factory: [{
			Id: String,
			home: String,
		}],
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
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Page;