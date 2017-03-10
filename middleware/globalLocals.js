const uuid = require('uuid')

module.exports = (req, res, next) => {
	res.locals.uuid = uuid;

	next();
}