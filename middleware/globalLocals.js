const pug  = require('pug');
const uuid = require('uuid');
const Site = require('../schemas/site');
const Page = require('../schemas/page');

module.exports = (req, res, next) => {
	const url = req._parsedOriginalUrl ? req._parsedOriginalUrl.pathname : req._parsedUrl.pathname
	const site = Site.find().items[0];
	const page = Page.findOne('url', url).items;

	res.locals.uuid = uuid;
	res.locals.site = site;
	res.locals.page = page;

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