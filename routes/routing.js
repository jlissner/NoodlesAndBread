const express      = require('express');
const flash        = require('connect-flash');
const passport     = require('passport');
const pug          = require('pug');
const strategies   = require('../config/passport');
const setFlash     = require('../modules/setFlash');
const sortBy       = require('../modules/sortBy');
const User         = require('../schemas/user');
const Page         = require('../schemas/page');
const Robot        = require('../schemas/robot');
const router       = express.Router();

router.use((req, res, next) => {
	const site = res.locals.site;

	// TODO: Make this smarter so that I don't have to do this on every page load
	Page.find('Id', site.Id).items.forEach((page) => {
		router.get(page.url, (req, res, next) => {
			const layout = site.layouts && site.layouts.filter((_layout) => _layout.name === page.layout)[0];

			pug.render(layout.pug, res.locals, (err, html) => {
				res.render(`layout.pug`, {
					title: page.title,
					description: page.description,
					layout: err || html,
					robots: page.robots,
					params: req.params,
				});
			});
		});
	});

	next();
});

module.exports = router;