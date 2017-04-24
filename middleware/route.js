const pug = require('pug');
const Site = require('../schemas/site');
const Page = require('../schemas/page');

module.exports = (req, res, next) => {
	const url = req._parsedOriginalUrl.pathname
	const page = res.locals.page;
	const site = res.locals.site;

	if(!page || !site) {
		next();
		return;
	}

	const layout = site && site.layouts && site.layouts.filter((_layout) => _layout.name === page.layout)[0];

	pug.render(layout.pug, res.locals, (err, html) => {
		res.render(`layout.pug`, {
			title: page.title,
			description: page.description,
			layout: err || html,
		});
	});	
}