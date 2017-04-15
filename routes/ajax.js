const express    = require('express');
const pug        = require('pug');
const http       = require('http');
const gm         = require('gm').subClass({ imageMagick: true });
const isLoggedIn = require('../middleware/isLoggedIn');
const formidable = require('../middleware/formidable');
const pickTable  = require('../modules/pickTable');
const s3         = require('../modules/s3');
const sendEmail  = require('../modules/sendEmail');
const RobotPart  = require('../schemas/robotPart');
const Robot      = require('../schemas/robot');
const router     = express.Router();

//// database ajax calls
	// used to see if (an) item(s) exist without returning the data of the items
	router.get('/exists/:table', (req, res) => {
		const field = req.query.field;
		const value = req.query.value;
		const findOne = req.query.findOne;
		const table = pickTable(req.params.table);

		if(!table){
			res.status(500).send('Please choose a table.');
			return;
		}

		const items = findOne ? table.findOne(field, value).items : table.find(field, value).items;

		res.send(items.length.toString());
	});

	router.get('/get/:table', isLoggedIn(true), (req, res) => {
		const field = req.query.field;
		const value = req.query.value;
		const findOne = req.query.findOne;
		const table = pickTable(req.params.table);

		if(!table){
			res.status(500).send('Please choose a table.');
			return;
		}

		const items = findOne ? table.findOne(field, value).items : table.find(field, value).items;

		res.send(items);
	});

	router.post('/add/:table', isLoggedIn(true), (req, res) => {
		const item = req.body;
		const table = pickTable(req.params.table);

		if(!table){
			console.error('Please choose a table.');
			res.status(500).send('Please choose a table.');
			return;
		}

		table.add(item)
		.then(() => {
			table.updateCache().then(() => {
				res.send(item);
			});
		}, (err) => {
			console.error(err);
			res.status(500).send(err);
		});
	});

	router.post('/update/:table', isLoggedIn(true), (req, res) => {
		const item = req.body.item;
		const table = pickTable(req.params.table);

		if(!table){
			console.error('Please choose a table.');
			res.status(500).send('Please choose a table.');
			return;
		}

		table.update(item)
			.then(() => {
				table.updateCache().then(() => {
					res.send(item);
				});
			}, (err) => {
				console.error(err);
				res.status(500).send(err);
			});
	});

	router.post('/delete/:table', isLoggedIn(true), (req, res) => {
		const key = req.body['key'];
		const table = pickTable(req.params.table);

		if(!table){
			console.error('Please choose a table.');
			res.status(500).send('Please choose a table.');
			return;
		}

		table.delete(key)
		.then(() => {
			table.updateCache().then(() => {
				res.send('success');
			});
		}, (err) => {
			console.error(err);
			res.status(500).send(err);
		});
	});

//// s3 ajax calls
	router.get('/file', (req, res) => {
		const file = req.query.file;
		const size = req.query.size;

		s3.getFile(req.query.file, (err, data) => {
			const imgBuf = data.Body
			if(err) {
				res.status(500).send(err);
				console.error(err);
				return;
			}

			if(size) {
				const _size = size.split('x');
				const width = _size[0];
				const height = _size[1];

				gm(imgBuf).resize(width, height)
				.setFormat('jpeg')
				.toBuffer((err, buffer) => {
					if(err) {
						console.error(err);
						res.status(500).send(err);
						return;
					}

					res.send(new Buffer(buffer));
				});				
			} else {
				res.send(new Buffer(imgBuf));
			}
		});
	});

	router.get('/getFiles', isLoggedIn(), (req, res) => {
		s3.getFiles((err, files, folder, subFolders, marker, nextMarker) => {
			if(err) {
				res.status(500).send(err);
				return;
			}

			res.send({files, folder, subFolders, marker, nextMarker});
		}, req.query.folder, req.query.marker, req.query.maxKeys);
	});

	router.get('/getRootDirectory', isLoggedIn(), (req, res) => {
		res.send(req.user.Id);
	});

	router.post('/upload', isLoggedIn(), formidable(), (req, res) => {
		const files = req.files || [];
		const length = files.length;


		function uploadFile(file) {
			const fileName = file.name.split('.');
			const fileType = fileName.pop();

			s3.uploadFile(`${req.fields.filePath}${file.name}`, file, function(err, data) {
				if (err) {
					console.error(err);
					res.status(500).send(err);

					return;
				} else if(files.length) {
					uploadFile(files.shift());
				} else {
					res.send('success');
				}
			}, fileType, req.fields.filePath);
		}

		uploadFile(files.shift());
	});

	router.post('/deleteFiles', isLoggedIn(), (req, res) => {
		const files = req.body.files;

		s3.deleteFiles(files, (err) => {
			if(err) {
				res.status(500).send(err);
				console.error(err);

				return;
			}

			res.send('success');
		})
	});

//// utility ajax calls
	router.get('/renderPugFile', (req, res) => {
		const params = req.query;
		const filePath = `views/${params.file}`;
		const locals = params.locals

		res.send(pug.renderFile(filePath, locals));
		return;

		fs.readFile(filePath, (err, data) => {
			if(err) {
				res.status(500).send(err);
				return
			}

			res.send(data);
		});
	});

	router.get('/renderPug', (req, res) => {
		pug.render(req.query.pug, req.query.locals || res.locals, (err, html) => {
			res.send(err ? String(err) : html)
		});
	});

//// robot calls
	// TODO: Make this a module
	function findPart(_parts, params, isOne, pageParams){
		if (!_parts) {
			return;
		}

		const value = params && params[0] && (params[0].value.indexOf(':') === 0 ? pageParams[params[0].field] : params[0].value) || undefined;

		if(params.length === 0) {
			return isOne ? _parts.findOne().items : _parts.find().items;
		} else if(params.length === 1) {
			return isOne ? _parts.findOne(params[0].field, value).items : _parts.find(params[0].field, value).items;
		} else {
			const _param = params.shift();

			return findPart(_parts.find(_param.field, value), params, isOne, pageParams);
		}
	}

	router.get('/robot/get', (req, res, next) => {
		const robot = Robot.findOne('_Id', req.query.robot.Id).items;
		if(!robot) {
			res.status(404).send('No Robot Found');
			return;
		}

		const pageParams = req.query.params;

		robot.parts.forEach((part) => {
			const _parts = RobotPart.find('Id', part.factory);

			res.locals[part.name] = findPart(_parts, part.params, part.isOne, pageParams);
		});

		pug.render(robot.body, res.locals, (err, html) => {
			res.send(err ? String(err) : html)
		});
	})

//// lambda calls
	router.get('/lambda/pug', (req, res) => {
		const options = {
			hostname: 'https://pyr3xaxxa0.execute-api.us-west-2.amazonaws.com',
			path: '/prod/pug',
		};

		try {
			http.request(options, (response) => {
				console.log(response);
			}, (err) => {
				console.log(err);
			})
		} catch(err) {
			console.log(err)
			next();
		}
	})

module.exports = router;