const pug  = require('pug');
const uuid = require('uuid');
const Site = require('../schemas/site');
const Page = require('../schemas/page');
const RobotFactory = require('../schemas/robotFactory');

module.exports = (req, res, next) => {
	const url = req._parsedOriginalUrl ? req._parsedOriginalUrl.pathname : req._parsedUrl.pathname
	const urlParts = url.split('/');
	const site = Site.find().items[0];

	res.locals.uuid = uuid;
	res.locals.site = site;
	res.locals.factories = RobotFactory.cached();

	// TODO: Cache Controls
	if(site.controls) {
		site.controls.forEach((control) => {
			pug.render(control.pug, res.locals, (err, html) => {
				res.locals.site[control.name] = html;
			});
		});
	}

	next();
}