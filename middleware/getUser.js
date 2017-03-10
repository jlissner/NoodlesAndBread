// route middleware to get the user info
function getUser(req, res, next) {
	if(req.user){
		res.locals.user = req.user;

		return next();
	} else {
		return next();
	}
}

module.exports = getUser;