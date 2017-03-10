const db   = require('../../config/db');
const cache = require('../cache');

const _duck = function(schema, items, isReady){
	this.isReady = isReady === undefined ? true : isReady;

	if(!schema || !schema.HASH || !schema.Table) {
		console.error('you must define a table, schema, AND hash');
		process.exit();
	}

	/* ~~~~~~~~~~~~~~~~~~~~~~~~ */
	/* ~~~~~~ Properties ~~~~~~ */
	/* ~~~~~~~~~~~~~~~~~~~~~~~~ */
		this.schema        = schema;
		this.table         = schema.Table;
		this.itemSchema    = schema.Item;
		this.schemaless    = schema.schemaless === undefined ? true : schema.schemaless;
		this.hash          = schema.HASH;
		this.hashType      = schema.HASHType;
		this.range         = schema.RANGE;
		this.rangeType     = schema.RANGEType;
		this.indexes       = schema.Indexes || [];
		this.cacheDuration = schema.CacheDuration || 60*60; // default to one hour TODO: change to one day when live
		this.uniqueBy      = schema.UniqueBy;
		this.items         = items;


	/* ~~~~~~~~~~~~~~~~~~~~~~~~ */
	/* ~~~~~~~~~ Init ~~~~~~~~~ */
	/* ~~~~~~~~~~~~~~~~~~~~~~~~ */
		if(!this.isReady){		
			const table = this.table
			const cacheDuration = this.cacheDuration;

			// check to see the list of tables against the current table name
			// if there is a match, set isReady = true
			// if there isn't a match, create the table
			// once table sucessfuly created, set isReady = true
			db.listTables({}, function(err, data){
				if(err){
					console.error(JSON.stringify(err, null, 2));

					process.exit();
				} else {
					if(data.TableNames.indexOf(table) === -1) {
						var params = {
						    TableName : table,
						    KeySchema: [
						        { AttributeName: schema.HASH,
						          KeyType: 'HASH'} //Partition key
						    ],
						    AttributeDefinitions: [       
						        { AttributeName: schema.HASH, 
						          AttributeType: schema.HASHType }
						    ],
						    ProvisionedThroughput: {       
						        ReadCapacityUnits: 1, 
						        WriteCapacityUnits: 1
						    }
						};

						if (schema.RANGE){
							params.KeySchema.push({AttributeName: schema.RANGE, KeyType: 'RANGE'}); //Sort key
							params.AttributeDefinitions.push({ AttributeName: schema.RANGE, AttributeType: schema.RANGEType });
						}

						db.createTable(params, function(err, data){
							if (err){
								console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2));

								process.exit();
							}

							cache.set(table, [], cacheDuration);
							isReady = true;
						});
					} else {
						db.lite.scan({TableName: table}, function(err, data){
							if (err) {
								console.error(JSON.stringify(err, null, 2));

								console.error('~~~ failed to initialize ~~~');
								process.exit();
							} else {
								cache.set(table, data.Items, cacheDuration);

								isReady = true;
							}
						});
					}
				}
			});
		}



	// testing
		/*	 
			var testPut = {
				  "TableName": "Continents",
				  "Item": {
				    "Id": "alsdkfjs",
				    "local": {
				      "email": "test@test.com",
				      "password": "test"
				    }
				  },
				  "ExpressionAttributeNames": {
				    //"#h": "Id",
				    "#local": "local",
				    "#email": "email",
				    //"#password": "password"
				  },
				  "ExpressionAttributeValues": {
				    //":h": "alsdkfj",
				    ":v0": "test@test.com",
				    //":v1": "password"
				  },
				  "ReturnValues": "ALL_OLD"
				}

			db.lite.put(testPut, function(err, data){
				if (err){
					console.error(JSON.stringify(err, null, 2));
				} else {
					console.log(JSON.stringify(data, null, 2));
				}

				process.exit();
			});

			var testScan = {
				TableName: 'Users',
				FilterExpression: '#n1.#n2 = :v1 OR #n1.#n3 = :v3 OR #n1.#n2 = :v2',
			    ExpressionAttributeNames:{
			        '#n1': 'local',
			        '#n2': 'email',
			        '#n3': 'password'
			    },
			    ExpressionAttributeValues: {
			        ':v1': 'test@test.com',
			        ':v2': 'test2@test.com',
			        ':v3': 'test'
			    }
			}

			db.lite.scan(testScan, function(err, data){
				if (err){
					console.error(JSON.stringify(err, null, 2));
				} else {
					console.log(JSON.stringify(data, null, 2));
				}

				process.exit();
			});
		
			var params = {
				"TableName": "Countries",
				"Key": {
					"Id": "6b50f784-a9df-47e2-891b-5b5126edf60a"
				},
				"ExpressionAttributeNames": {
					"#names": "names",
					"#official": "official",
					"#native": "native"
				},
				"ExpressionAttributeValues": {
					":empty": {},
					":0": "Serious Country Name",
					":1": "El Nameo"
				},
				"UpdateExpression": "set #names= if_not_exists(#names, :empty), #names.#official= :0, #names.#native= :1"
			}

			db.lite.update(params, function(err, data){
									if (err){
										console.error(err);
										process.exit();
									} else {
										console.log('success');
										process.exit();
									}
								});
		*/
}

module.exports = _duck;