const fs    = require('fs');
const awsS3 = require('../config/s3.js');
const s3 = {};

function getSetFolders(folderName, folder, subFolders) {
	if(subFolders && subFolders.length > 0) {
		folder[folderName] = folder[folderName] || {};

		getSetFolders(subFolders.shift(), folder[folderName], subFolders)
	} else if(!folder[folderName]) {
		folder[folderName] = false;
	};
}

function createFolderStructure(files) {
	const folders = {};

	files.forEach((file) => {
		const fileArr = file.split('/');
		fileArr.pop(); // get rid of the file name, only worrying about the folders

		getSetFolders(fileArr.shift(), folders, fileArr);
	});

	return folders
};

s3.getFile = (key, callback) => {
	if(!key) {
		console.error('A key is required to getFile');
		callback('A key is required to getFile');
	}

	const options = {
		Bucket: 'noodlesandbread',
		Key: key,
	}

	awsS3.getObject(options, (err, data) => {
		callback(err, data);
	})
}

s3.getFiles = (callback, folder, marker, subFolders, bucketObjects) => {
	if(!callback) {
		console.error('A callback is required for getFiles');
		return;
	}

	const _subFolders = subFolders || [];
	const _bucketObjects = bucketObjects || [];
	const prefix = folder || ''
	const options = {
		Bucket: 'noodlesandbread',
		Prefix: prefix,
		Delimiter: '/',
		Marker: marker,
	}

	awsS3.listObjects(options, function(err, data) {
		if (err) {
			callback(err);
			console.error(err, err.stack)
			return;
		};

		data.Contents.forEach((i) => {
			const key = i.Key.split('/');
			key.pop();

			if((key.length && prefix === `${key.join('/')}/`) || (prefix === '')) {
				_bucketObjects.push(i);
			}
		});

		data.CommonPrefixes.map((folderPath) => {
			const folders = folderPath.Prefix.split('/'); 

			folders.pop(); // the last item in the array will always be an empty string
			_subFolders.push(folders.pop()); // push the last item, the folder name
		});

		if(!data.NextMarker) {
			callback(null, _bucketObjects, prefix, _subFolders, data.Marker, data.NextMarker);
		} else {
			s3.getFiles(callback, prefix, data.NextMarker, _subFolders, _bucketObjects)
		}
	});
}

s3.uploadFile = (fileName, file, callback) => {
	fs.readFile(file.path, (err, data) => {
		if(err) {
			callback(err);
			return;
		}

		const params = {
			Bucket: 'noodlesandbread', /* required */
			Key: fileName, // file path & name
			Body: new Buffer(data), // the file
		};

		awsS3.putObject(params, callback);
	});
}

s3.deleteFiles = (files, callback) => {
	const options = {
		Bucket: 'noodlesandbread',
		Delete: {
			Objects: files,
		},
	};

	awsS3.deleteObjects(options, callback);
}

module.exports = s3;