const express      = require('express');
const flash        = require('connect-flash');
const passport     = require('passport');
const strategies   = require('../config/passport');
const isLoggedIn   = require('../middleware/isLoggedIn');
const setFlash     = require('../modules/setFlash');
const sortBy       = require('../modules/sortBy');
const User         = require('../schemas/user');
const RobotFactory = require('../schemas/robotFactory');
const router       = express.Router();

strategies.local(passport);

router.get('/admin', (req, res) => {
	res.render('admin/admin', {
		factories: RobotFactory.cached(),
	});
});

router.get('/make-robot-factory', (req, res) => {
	res.render('make-robot-factory');
});

router.get('/make-robot-body', (req, res) => {
	res.render('make-robot-body', {
		factories: RobotFactory.cached(),
	});
});

router.get('/make-robot', (req, res) => {
	res.render('make-robot', {
		factories: RobotFactory.cached(),
	});
});

/* router.get('/', (req, res, next) => {
	res.render('index');
}); */

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

router.post('/auth/local', User.getCached(), passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/',
	failureFlash: true
}));

module.exports = router;