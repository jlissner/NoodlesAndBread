const User         = require('../schemas/user');
const RobotFactory = require('../schemas/robotFactory');
const Page         = require('../schemas/page');
const Robot        = require('../schemas/robot');

function pickTable(table) {
	switch(table) {
		case 'Users': {
			return User;
		}
		case 'RobotFactories': {
			return RobotFactory;
		}
		case 'Robots': {
			return RobotFactory;
		}
		case 'Pages': {
			return Page;
		}
		default:
			return;
	}
}

module.exports = pickTable;