const uuid              = require('uuid');
const LocalStrategy     = require('passport-local').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const User              = require('../schemas/user');

const strategies    = {};

strategies.local = (passport) => {
	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
	// requrired for persistent login sessions
	// passport needs ability to serialize and unserialize user out of session

	// used to serialize the user for the session
	passport.serializeUser((user, done) => {
		done(null, user.Id);
	});

	// used to deserialize the user
	passport.deserializeUser((id, done) => {
		User.findOne({'Id': id}).then((duck) => {
			var user = duck.items;

			if (user){
				done(null, user);
			} else {
				done(null, false);
			}
		}, (err) => {
			console.error(err);
		});
	});

	// Local Signup ===================================================

	// we are using named strategies since we have one for login and one for signup

	// 'local-signup' is the NAME of the PASSPORT STRATEGY created below, as indicated by the first param
	passport.use('local-signup', new LocalStrategy({
			usernameField: 'local.email',
			passwordField: 'local.password',
			passReqToCallback: true // allows us to pass back the entire request to the callback
		}, (req, email, password, done) => {
			User.findOne({'local.email': email}).then((duck) => {
				if (duck.items) {
					return done(null, false, req.flash('error', 'That email is already taken'));
				} else if(password.length < 4) {
					return done(null, false, req.flash('error', 'Your Passphrase must be at least 4 characters long.'));
				} else {
					const newUser = {
						Id: uuid.v4(), 
						local: {
							email: email, 
							password: User.generateHash(password)
						},
						name: {
							first: req.body['name.first'],
							last: req.body['name.last']
						}
					}

					User.add(newUser).then((user) => {
						User.updateCache().then(() => {
							done(null, newUser);
						});
					}, (err) => {
						console.error(err);
						return done(null, false, req.flash('error', 'Something went wrong, please try again.'));
					});
				}
			}, (err) => {
				console.error(err);
			});
		}
	));

	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		}, (req, email, password, done) => {
			User.findOne({'local.email': email}).then((duck) => {
				const user = duck.items

				if(user && User.validPassword(password, user.local.password)){
					return done(null, user);
				}

				return done(null, false, req.flash('error', 'Sorry, the password and email did not match!'));
			}, (err) => {
				console.error(err);
			});
		}
	));
};

module.exports = strategies;