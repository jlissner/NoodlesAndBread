const uuid = require('uuid');
const Site = require('../schemas/site');

module.exports = (req, res, next) => {
	res.locals.uuid = uuid;
	res.locals.site = Site.find().items[0] || {};

	next();
}