const express      = require('express');
const flash        = require('connect-flash');
const passport     = require('passport');
const strategies   = require('../config/passport');
const isLoggedIn   = require('../middleware/isLoggedIn');
const setFlash     = require('../modules/setFlash');
const sortBy       = require('../modules/sortBy');
const User         = require('../schemas/user');
const Page         = require('../schemas/page');
const RobotFactory = require('../schemas/robotFactory');
const RobotPart    = require('../schemas/robotPart');
const Robot        = require('../schemas/robot');
const router       = express.Router();

strategies.local(passport);

router.get('/admin', (req, res) => {
	res.render('admin/admin', {
		robots: Robot.cached(),
		factories: RobotFactory.cached(),
		parts: RobotPart.cached(),
		pages: Page.cached(),
	});
});

// authentication
router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

router.post('/auth/signup', passport.authenticate('local-signup', {
	successRedirect: '/',
	failureRedirect: '/',
	failureFlash: true
}));

router.post('/auth/local', passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/',
	failureFlash: true
}));

module.exports = router;