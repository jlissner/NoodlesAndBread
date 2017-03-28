const Duck = require('../modules/duck');

const Site = Duck({
	Table: 'NoodlesSites',
	Item: {
		Id: String, // Domain Id
		_Id: String , // Subdomain Id
		domain: String,
		subDomain: String,
		name: String,
		title: String,
		description: String,
		logo: String,
		favicon: String,
		layouts: [{
			name: String,
			pug: String,
		}],
		scripts: [{
			name: String,
			src: String,
			isDisabled: Boolean,
		}],
		styles: [{
			name: String,
			src: String,
			isDisabled: Boolean,
		}],
		controls: [{
			name: String,
			category: String,
			pug: String,
			documentation: String,
		}],
	},
	
	HASH: 'Id',
	HASHType: 'S',
	RANGE: '_Id',
	RANGEType: 'S',
	CacheDuration: 60*60*24, // 24h -- node-cache timing is in seconds, not miliseconds
	//, Indexes : ['localEmail']
}, null, false);

module.exports = Site;