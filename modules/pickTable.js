const User         = require('../schemas/user');
const RobotFactory = require('../schemas/robotFactory');
const RobotBody    = require('../schemas/robotBody');
const Robot        = require('../schemas/robot');
const Site         = require('../schemas/site');
const Page         = require('../schemas/page');

function pickTable(table) {
	switch(table) {
		case 'Users': {
			return User;
		}
		case 'RobotFactories': {
			return RobotFactory;
		}
		case 'RobotBodies': {
			return RobotBody;
		}
		case 'Robots': {
			return Robot;
		}
		case 'Sites': {
			return Site;
		}
		case 'Pages': {
			return Page;
		}
		default:
			return;
	}
}

module.exports = pickTable;