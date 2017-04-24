const db            = require('../../config/db');
const cache         = require('../cache');

function returnItem(obj, field, value, contains) {
	if (!obj || !field) { return false; }
	if (!(field instanceof Array)) { field = field.split('.'); }

	const currentField = field.shift();
	if (field.length) {
		return returnItem(obj[currentField], field, value, contains);
	}

	const objValue = obj[currentField];
	if(objValue instanceof Array) {
		return objValue.indexOf(value) > -1;
	}

	if(value instanceof Array) {
		return value.indexOf(objValue) > -1;
	}

	return contains ? objValue.indexOf(value) > -1 : objValue === value;
}

function getItems(getType, params) {
	return new Promise((resolve, reject) => {
		switch(getType) {
			case 'get': {
				db.lite.get(params, (err, data) => {
					if(err) {
						reject(err);
						return;
					}

					resolve(data.Item)
				});

				break;
			}
			case 'query': {
				db.lite.query(params, (err, data) => {
					if(err) {
						reject(err);
						return;
					}

					resolve(data.Items)
				});

				break;
			}
			case 'scan': 
			default: {
				db.lite.scan(params, (err, data) => {
					if(err) {
						reject(err);
						return;
					}

					resolve(data.Items)
				});
			}
		}
	});
}

module.exports = (Duck, _duck) => {
	_duck.prototype.find = function (query) {
		const _this = this;
		const schema = _this.schema;
		const table = _this.table;
		const hash = _this.hash;
		const range = _this.range;
		const getType = query ? 'query' : 'scan';
		const params = Duck.createParams(getType, {table, hash, range, query});
		let loading = true;

		return new Promise((resolve, reject) => {
			getItems(getType, params).then((items) => {
				for (key in query) {
					if(Object.prototype.hasOwnProperty.call(query, key) && key !== hash && key !== range) {
						items.filter((item) => returnItem(item, key, query[key]));
					}
				}

				_this.items = items;

				resolve(_this);
			}, (err) => {
				console.error(err);

				reject(err);
			});
		});
	}

	_duck.prototype.findOne = function (query) {
		const _this = this;
		const schema = _this.schema;
		const table = _this.table;
		const hash = _this.hash;
		const range = _this.range;
		const getType = (query[hash] && (!range || (range && query[range]))) ? 'get' : ((query && query[hash]) ? 'query' : 'scan');
		const params = Duck.createParams(getType, {table, hash, range, query});

		
		return new Promise((resolve, reject) => {
			getItems(getType, params).then((items) => {
				if(getType === 'get') {
					_this.items = items;
				} else {
					for (key in query) {
						if(Object.prototype.hasOwnProperty.call(query, key) && key !== hash && key !== range) {
							items.filter((item) => returnItem(item, key, query[key]));

							if(items.length < 2) {
								break;
							}
						}
					}

					_this.items = items[0]
				}

				resolve(_this);
			}, (err) => {
				console.error(err)

				reject(err);
			});
		});
	}
}