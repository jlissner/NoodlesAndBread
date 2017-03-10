const Page = require('../schemas/page');

module.exports = (req, res, next) => {
	const url = req._parsedOriginalUrl.pathname
	const page = Page.findOne('url', url).items;

	if(!page) {
		next();
		return;
	}

	// find url => get page
	res.render(`templates/${page.template}.pug`, {
		title: page.title,
		description: page.description,
		robots: page.robots
	});
}