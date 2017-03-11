const User         = require('../schemas/user');
const RobotFactory = require('../schemas/robotFactory');
const RobotBody    = require('../schemas/robotBody');
const Robot        = require('../schemas/robot');
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
		case 'Pages': {
			return Page;
		}
		default:
			return;
	}
}

module.exports = pickTable;