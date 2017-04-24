const _duck = require('./_duck');
const Duck = (schema, items, isReady) => {
	return new _duck(schema, items, isReady);
}

/* ~~~ init ~~~ */
require('./createParams')(Duck)
require('./methods')(_duck);
require('./promises')(_duck);
require('./middleware')(_duck);
require('./find')(Duck, _duck);

module.exports = Duck;
