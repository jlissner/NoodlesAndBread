const pug   = require('pug');
const uuid  = require('uuid');
const cache = require('../modules/cache');
const Site  = require('../schemas/site');
const Page  = require('../schemas/page');
const RobotFactory = require('../schemas/robotFactory');

module.exports = (req, res, next) => {
	const url = req._parsedOriginalUrl ? req._parsedOriginalUrl.pathname : req._parsedUrl.pathname
	const urlParts = url.split('/');
	let site = cache.get('site');

	res.locals.uuid = uuid;
	res.locals.factories = RobotFactory.cached();


	if(site) {
		res.locals.site = site;

		// TODO: Cache Controls
		if(site.controls) {
			site.controls.forEach((control) => {
				pug.render(control.pug, res.locals, (err, html) => {
					res.locals.site[control.name] = html;
				});
			});
		}


		next();
	} else {
		Site.find().then((duck) => {
			site = duck.items[0];
			cache.set('site', site);
			res.locals.site = site;

			// TODO: Cache Controls
			if(site.controls) {
				site.controls.forEach((control) => {
					pug.render(control.pug, res.locals, (err, html) => {
						res.locals.site[control.name] = html;
					});
				});
			}

			next();
		}, (err) => {
			console.error(err);
		});
	}
}