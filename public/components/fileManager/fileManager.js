/* global jQuery */

void function initS3($) {
	'use strict';

	function getRootDirectory($wrapper) {
		$.ajax({
			type: 'GET',
			url: '/getRootDirectory',
			success: (data) => {
				$wrapper.prop('rootDirectory', data);
				$wrapper.trigger('s3Initialized');
			},
		})
	}

	function getFiles(e, options) {
		const $wrapper = e.data.wrapper;

		$wrapper.trigger('gettingFiles');

		if(options && options.files) {
			$wrapper.trigger('gotFiles', [null, options])
			return;
		}

		$.ajax({
			type: 'GET',
			url: '/getFiles',
			dataType: 'json',
			contentType: 'application/json',
			data: options || {},
			success: (data) => {
				$wrapper.trigger('gotFiles', [null, data])
			},
			error: (err) => {
				$wrapper.trigger('gotFiles', [err])
			},
		});
	}

	function uploadFiles(e, filesToUpload) {
		const $wrapper = e.data.wrapper;
		const files = filesToUpload;

		if (files.length > 0){
			$wrapper.trigger('fileUploading');
			// create a FormData object which will be sent as the data payload in the
			// AJAX request
			const formData = new FormData();

			// loop through all the selected files and add them to the formData object
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// add the files to formData object for the data payload
				formData.append('files', file, file.name);
			}

			formData.append('filePath', $wrapper.prop('uploadFilePath'))

			$.ajax({
				url: '/upload',
				type: 'POST',
				data: formData,
				processData: false,
				contentType: false,
				success: () => {
					$wrapper.trigger('filesUploaded');
				},
				error: (err) => {
					$wrapper.trigger('filesUploaded', [err]);
				},
			});
		} else {
			$wrapper.trigger('fileUploading', [true]);
		}
	}

	function deleteFiles(e, filesToDelete) {
		const $wrapper = e.data.wrapper;

		$wrapper.trigger('deletingFiles');

		$.ajax({
			type: 'POST',
			url: '/deleteFiles',
			contentType: 'application/json',
			data: JSON.stringify({files: filesToDelete}),
			success: () => {
				$wrapper.trigger('filesDeleted');
			},
			error: (err) => {
				$wrapper.trigger('filesDeleted', [err]);
			},
		})
	}

	function s3(wrapper) {
		const $wrapper = $(wrapper);

		$wrapper.off('uploadFiles').on('uploadFiles', {wrapper: $wrapper}, uploadFiles);
		$wrapper.off('getFiles').on('getFiles', {wrapper: $wrapper}, getFiles);
		$wrapper.off('deleteFiles').on('deleteFiles', {wrapper: $wrapper}, deleteFiles);
		
		getRootDirectory($wrapper);
	}

	$.fn.s3 = function init() {
		return this.each((index, wrapper) => {
			s3(wrapper);
		});
	}
}(jQuery.noConflict());


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~ file manager ~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
void function initFileManager($) {
	'use strict';

	function getFileSize(size) {
		if (size > 1073741824) {
			return `${Math.ceil(size/1024/1024/1024)}gb`;
		} else if (size > 1048576) {
			return `${Math.ceil(size/1024/1024)}mb`;
		} else if (size > 1024) {
			return `${Math.ceil(size/1024)}kb`;
		}

		return `${size}b`;
	}

	function buildImage(image) {
		const imageSize = getFileSize(image.Size);
		const key = image.Key;
		const date = image.LastModified;
		const img = `
			<div class='file-manager--image' title="${key}" data-file-date="${date}">
				<div class="row">
					<div class="col-xs-4">
						<img class="image--content" src="https://s3-us-west-2.amazonaws.com/noodlesandbread/${key}" />
					</div>
					<div class="col-xs-8">
						<h3 class="image--name">${key.split('/')[key.split('/').length-1]}</h3>
						<h4 class="image--size">${imageSize || 'unknown'}</h4>
					</div>
				</div>
			</div>
		`;

		return img;
	}

	function fileUploading($uploaderSubmit) {
		return (e) => {
			e.stopPropagation();

			$uploaderSubmit.attr('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Uploading...');
		}
	}

	function filesUploaded($content, $directory, $uploader) {
		return	(e, err) => {
			e.stopPropagation();

			$uploader.toggleClass('hidden');

			if(err) {
				$content.text('Sorry, something went wrong uploading your image.');
				return;
			}

			$directory.trigger('getFiles', [{folder: $directory.prop('currentDirectory')}]);
		}
	}

	function changingFiles(e) {
		e.stopPropagation();

		const $content = e.data.content;
		const $deleteStartButton = e.data.deleteStartButton;

		$content.html('<div class="p-Xl ta-C js-waiting"><i class="fa fa-spinner fa-spin"></div>');
		$deleteStartButton.prop('disabled', true);
	}

	function gotFiles($wrapper, $content, $uploader, $sort) {
		const $currentDirectory = $('[data-file-manager="current-directory"]');

		return (e, err, data) => {
			if (err) {
				$content.text('Sorry, something went wrong getting the images.');
				return;
			}

			const files = data.files || [];
			const folder = data.folder;

			//const marker = data.marker;
			//const nextMarker = data.nextMarker;

			$uploader.prop('uploadFilePath', folder || '');
			if(folder) {
				const folderPath = folder.split('/');

				folderPath[0] = 'My Files';
				$currentDirectory.text(folderPath.join('/'));
			} else {
				$currentDirectory.text('Root')	;
			}

			$content.html('');

			const images = files.sort((a, b) => {
				if(a.LastModified > b.LastModified) {return -1}
				if(a.LastModified < b.LastModified) {return 1}
				return 0;
			});

			

			if(!images.length) {
				$sort.addClass('hidden');
				$content.text('There are no files in this folder, you can upload some or check one of it\'s sub-folders.');
			} else {
				$sort.removeClass('hidden').find('.active').removeClass('active');
				$sort.find('[data-sort="date"]').addClass('active');
				images.forEach((image) => {
					$content.append(buildImage(image))
				});
			}

			$content
				.closest('[data-function*="scroll"]')
				.trigger('initScroll');
		}
	}

	function searchFiles(e) {
		e.stopPropagation();
		e.preventDefault();

		const $search = e.data.search;
		const $content = e.data.content;
		const $files = $content.find('.file-manager--image');
		const val = $search.val().toLowerCase();

		$files.each((i, file) => {
			const $file = $(file);
			const fileName = $file.attr('title').toLowerCase();

			if(fileName.indexOf(val) === -1) {
				$file.addClass('hidden');
			} else {
				$file.removeClass('hidden');
			}
		});
	}

	function sortFiles($content, $files, sortBy, direction) {
		$content.empty();
		$files.sort((a, b) => {
			const $a = $(a);
			const $b = $(b);

			if (sortBy === 'date') {
				const aDate = new Date($a.attr('data-file-date'));
				const bDate = new Date($b.attr('data-file-date'));

				if(aDate > bDate) {
					return direction === 'asc' ? 1 : -1
				} else if (aDate < bDate) {
					return direction === 'asc' ? -1 : 1
				}

				return 0
			}

			const aName = $a.attr('title').toLowerCase();
			const bName = $b.attr('title').toLowerCase();

			if(aName > bName) {
				return direction === 'asc' ? 1 : -1
			} else if (aName < bName) {
				return direction === 'asc' ? -1 : 1
			}

			return 0
		});
		$content.append($files);
	}

	function selectFile(e, $targetFile) {
		e.stopPropagation();

		const $content = e.data.content;
		const $deleteStartButton = e.data.deleteStartButton;

		$targetFile.addClass('file-manager--image__active');

		if($content.find('.file-manager--image__active').length) {
			$deleteStartButton.prop('disabled', false);
		} else {
			$deleteStartButton.prop('disabled', true);
		}
	}

	function fileManager(wrapper) {
		const $wrapper = $(wrapper);

		if($wrapper.prop('fileManagerInitialized')) {
			return;
		}

		const $content = $wrapper.find('[data-file-manager="content"]'); // where all the files are shown
		const $search = $wrapper.find('[data-file-manager="search"]');

		const $sort = $wrapper.find('[data-file-manager="sort"]');
		const $sortDirection = $sort.find('[data-sort-direction]');
		
		const $deleteStartButton = $wrapper.find('[data-file-manager="delete-start"]'); // button to open delete prompt
		const $deletePrompt = $wrapper.find('[data-file-manager="delete-prompt"]'); // prompt to confirm delete
		const $deleteButton = $wrapper.find('[data-file-manager="delete"]'); // button to delete selected files
		const $deleteCancelButton = $wrapper.find('[data-file-manager="delete-cancel"]'); // cancel delete
		const $deleteGrammar = $deletePrompt.find('.js-grammar');
		
		const $uploader = $wrapper.find('[data-file-manager="uploader"]'); // container for uploader
		const $uploaderStart = $wrapper.find('[data-file-manager="upload"]'); // button to start the upload
		const $uploaderSubmit = $wrapper.find('[data-uploader="upload"]'); // button to submit the upload
		
		const $directory = $wrapper.find('[data-file-manager="directory"]'); // where the file structure is shown

		$content.on('dragenter', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$content.addClass('file-manager--content__active');
		});

		$content.on('dragleave', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$content.removeClass('file-manager--content__active');
		});

		$content.on('dragover', (e) => {
			e.stopPropagation();
			e.preventDefault();

			let effect;

			try {
				effect = e.originalEvent.dataTransfer.effectAllowed;
			} catch (_error) {
				effect = null;
			}

			e.originalEvent.dataTransfer.dropEffect = effect === 'move' || effect === 'linkMove' ? 'move' : 'copy';
		});

		$content.on('drop', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$uploader.toggleClass('hidden');
			$uploader.trigger('filesAdded', [e.originalEvent.dataTransfer.files]);
			$content.removeClass('file-manager--content__active');
		})

		$search.on('input', {content: $content, search: $search}, searchFiles);

		$sort.on('click', 'button', (e) => {
			e.stopPropagation();
			e.preventDefault();

			const $target = $(e.target);
			const sortBy = $target.attr('data-sort');
			const sortDirection = $sortDirection.attr('data-sort-direction');
			const $activeSort = $sort.find('.active');
			const reverseDirection = sortDirection === 'asc' ? 'desc' : 'asc';
			const $files = $content.find('.file-manager--image');

			if (!sortBy) {
				$sortDirection.attr('data-sort-direction', reverseDirection);
				sortFiles($content, $files, $activeSort.attr('data-sort'), reverseDirection);
			} else if ($target.hasClass('active')){
				$sortDirection.attr('data-sort-direction', reverseDirection);
				sortFiles($content, $files, sortBy, reverseDirection);
			} else {
				$activeSort.removeClass('active');
				$target.addClass('active');
				sortFiles($content, $files, sortBy, sortDirection);
			}
		});
		
		$directory.on('gettingFiles', {content: $content, deleteStartButton: $deleteStartButton}, changingFiles);
		$directory.on('deletingFiles', {content: $content, deleteStartButton: $deleteStartButton}, changingFiles);
		$directory.on('gotFiles', gotFiles($wrapper, $content, $uploader, $sort));
		$directory.directory();

		$uploader.on('fileUploading', fileUploading($uploaderSubmit));
		$uploader.on('filesUploaded', filesUploaded($content, $directory, $uploader));
		$uploaderStart.on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$uploader.toggleClass('hidden');
		});
		$uploader.uploader();

		$wrapper.on('selectFile', {content: $content, deleteStartButton: $deleteStartButton}, selectFile);
		
		$content.on('click', '.file-manager--image', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$wrapper.trigger('selectFile', [$(e.currentTarget), $content.find('.file-manager--image__active')]);
		});

		$deleteStartButton.add($deleteCancelButton).on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			if($content.find('.file-manager--image__active').length > 1) {
				$deleteGrammar.text('these')
			} else {
				$deleteGrammar.text('this')
			}
			$deletePrompt.toggleClass('hidden');
		});

		$deleteButton.on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			const files = [];
			$content.find('.file-manager--image__active').each((i, item) => {
				const key = $(item).attr('title'); // "images/my-picture-name.jpg"
				const fileName = key.split('.')[0]; // "images/my-picture-name"
				const fileType = key.split('.')[1]; // "jpg"
				const fileSizes = ['large', 'medium', 'small', 'thumb1', 'thumb2'];

				fileSizes.forEach((size) => {
					files.push({Key: `${fileName}-${size}.${fileType}`});
				});
			});

			$deleteButton.prop('disabled', true).text('Deleting').prepend('<i class="fa fa-spin fa-spinner" aria-hidden="true"></i> ')
			$directory.trigger('deleteFiles', [files]);
		});

		$directory.on('filesDeleted', (e) => {
			e.stopPropagation();

			$deletePrompt.addClass('hidden');
			$deleteButton.prop('disabled', false).text('Delete')
		})
		
		$wrapper.prop('fileManagerInitialized', true);
	}

	$.fn.fileManager = function init() {
		return this.each((index, wrapper) => { fileManager(wrapper); });
	}

	// run after dom has loaded
	$(() => {
		const $fileManagers = $('[data-function*="file-manager"');

		if($fileManagers.length) {
			$fileManagers.fileManager();
		}
	});
}(jQuery.noConflict());


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~ uploader ~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
void function initUploader($) {
	'use strict';

	function addFileToUploadQueue(e, files) {
		e.stopPropagation();
		e.preventDefault();

		$(e.data.wrapper).trigger('filesAdded', [files]);
	}

	function deleteFileFromQueue($wrapper, $uploadButton) {
		return (e) => {
			e.stopPropagation();
			e.preventDefault();

			const $file = $(e.target).closest('li');
			const fileName = $file.attr('data-file-name');
			const filesToUpload = $wrapper.prop('filesToUpload') || [];

			filesToUpload.forEach((file, i) => {
				if(file.name === fileName) {
					filesToUpload.splice(i, 1);
					return;
				}
			});

			$file.detach();

			if(filesToUpload.length === 0) {
				$uploadButton.prop('disabled', true);
			}

			$wrapper.prop('filesToUpload', filesToUpload)
		}
	}

	function filesAdded(e, files) {
		e.stopPropagation();
		e.preventDefault();

		const $wrapper = e.data.wrapper;
		const $filesList = e.data.filesList;
		const $uploadButton = e.data.uploadButton;
		const filesToUpload = $wrapper.prop('filesToUpload') || [];

		for (let i = 0, length = files.length; i < length; i++) {
			const file = files[i];
			const duplicateFile = $filesList.find('li').filter((j, item) => $(item).attr('data-file-name') === file.name).length > 0;

			if(duplicateFile) {
				return; // ignore duplicate files
			}

			filesToUpload.push(file);
			$filesList.append(`<li data-file-name='${file.name}'><button class='uploader--delete' data-uploader='delete'><i class='fa fa-times' aria-hidden='true'></i><span class='sr-only'>Remove File From Upload List</i></button>${file.name}</li>`);
			$uploadButton.prop('disabled', false);
		}

		$wrapper.prop('filesToUpload', filesToUpload);
	}

	function filesUploaded(e) {
		const $wrapper = e.data.wrapper;
		const $filesList = e.data.filesList;
		const $uploadButton = e.data.uploadButton;

		$wrapper.prop('filesToUpload', []);
		$filesList.empty();
		$uploadButton.text('Upload').prop('disabled', false);
	}

	function uploader(wrapper) {
		const $wrapper = $(wrapper);
		if($wrapper.prop('uploaderInitialized')) {
			return;
		}
		const $fileDrop = $wrapper.find('[data-uploader="file-drop"]'); // area where files can be dragged and dropped to for upload
		const $filesList = $wrapper.find('[data-uploader="files"]'); // list of files to be uploaded
		const $uploadButton = $wrapper.find('[data-uploader="upload"]'); // button to do upload
		const $cancelButton = $wrapper.find('[data-uploader="cancel"]'); // button to cancel the upload
		const $filesInput = $('<input type="file" multiple="true">'); // created in the dom but never put on the page, used so user can add file by clicking on file drop location		

		$wrapper.on('filesAdded', {wrapper: $wrapper, filesList: $filesList, uploadButton: $uploadButton}, filesAdded);

		$cancelButton.on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$filesList.empty();
			$wrapper.prop('filesToUpload', []);
			$uploadButton.prop('disabled', true);
			$wrapper.toggleClass('hidden');
		});

		$filesList.on('click', '[data-uploader="delete"]', deleteFileFromQueue($wrapper, $uploadButton));

		$fileDrop.on('dragenter', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$fileDrop.addClass('uploader--file-drop__active');
		});

		$fileDrop.on('dragleave', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$fileDrop.removeClass('uploader--file-drop__active');
		});

		$fileDrop.on('dragover', (e) => {
			e.stopPropagation();
			e.preventDefault();

			let effect;

			try {
				effect = e.originalEvent.dataTransfer.effectAllowed;
			} catch (_error) {
				effect = null;
			}

			e.originalEvent.dataTransfer.dropEffect = effect === 'move' || effect === 'linkMove' ? 'move' : 'copy';
		});

		$fileDrop.on('drop', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$fileDrop.trigger('addFileToUploadQueue', [e.originalEvent.dataTransfer.files]);
			$fileDrop.removeClass('uploader--file-drop__active');
		});
		$fileDrop.on('addFileToUploadQueue', {wrapper: $wrapper}, addFileToUploadQueue);

		$fileDrop.on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$filesInput.click();
		});

		$filesInput.on('change', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$fileDrop.trigger('addFileToUploadQueue', [$filesInput[0].files]);
		});

		$uploadButton.on('click', (e) => {
			e.stopPropagation();
			e.preventDefault();

			$wrapper.trigger('uploadFiles', [$wrapper.prop('filesToUpload')]);
		});

		$wrapper.on('filesAdded', {wrapper: $wrapper, filesList: $filesList, uploadButton: $uploadButton}, filesAdded);
		$wrapper.on('filesUploaded', {wrapper: $wrapper, filesList: $filesList, uploadButton: $uploadButton}, filesUploaded)
		$wrapper.s3();

		$wrapper.prop('uploaderInitialized', true);
	}

	$.fn.uploader = function init(options) {
		return this.each((index, wrapper) => {
			uploader(wrapper, options);
		});
	}
}(jQuery.noConflict());

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~ directory ~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
void function initDirectory($) {
	'use strict';

	function getFiles(e) {
		e.stopPropagation();
		e.preventDefault();

		const $wrapper = e.data.wrapper;
		const $folder = $(e.target);
		const $icon = $folder.find('> i');
		const isOpen = $icon.hasClass('fa-folder-open')
		const folder = $folder.attr('data-prefix');

		if(isOpen && folder === $wrapper.prop('currentDirectory')) {
			$folder.find('> i').removeClass('fa-folder-open').addClass('fa-folder');
			$folder.find('> ul').slideUp('270');

			return;
		}

		const options = {
			folder,
			files: $folder.prop('files'),
			subFolders: $folder.prop('subFolders'),
		}

		$wrapper.off('click', getFiles);
		$wrapper.trigger('getFiles', [options]);
	}

	function gotFiles(e, err, data) {
		if(err) { return; }

		const $wrapper = e.data.wrapper;
		const folder = data.folder;
		const subFolders = data.subFolders;
		const $folder = $wrapper.find(`[data-prefix="${folder}"]`);

		$folder.prop('files', data.files);
		$folder.prop('subFolders', subFolders);
		$wrapper.prop('currentDirectory', folder);
		$wrapper.trigger('addFolders', [folder, subFolders]);
		$wrapper.on('click', '[data-prefix]', {wrapper: $wrapper}, getFiles);
	}

	function filesDeleted(e, err) {
		e.stopPropagation();

		if(err) {return;}

		const $wrapper = e.data.wrapper;
		const folder = $wrapper.prop('currentDirectory');

		$wrapper.prop('currentDirectory', '');
		$wrapper.trigger('getFiles', {folder});

	}

	function makeFolder(parentDirectory, folder, $wrapper) {
		const $folder = $('<li/>', { // the base folder element
			'data-prefix': folder ? `${parentDirectory || ''}${folder}/` : '',
			text: ` ${folder === $wrapper.prop('rootDirectory') ? 'My Files' : folder || 'My Files'}`,
		});
		const $folderIcon = $('<i/>', {
			'class': 'fa fa-folder',
			'aria-hidden': 'true',
		});

		$folder.prepend($folderIcon);

		$folder.append($('<ul/>', {style: 'display: none;'})) // where the next set of sub folders will live
		
		return $folder;
	}

	function addFolders(e, parentDirectory, folders) {
		e.stopPropagation();



		const $wrapper = e.data.wrapper;
		const $parentDirectory = $wrapper.find(`[data-prefix="${parentDirectory || ''}"]`);
		const $parentDirectorySubFoldersList = $parentDirectory.find('> ul');

		$parentDirectory.find('> i').removeClass('fa-folder').addClass('fa-folder-open');

		folders.forEach((folder) => {
			if($parentDirectorySubFoldersList.find(`> [data-prefix="${parentDirectory || ''}${folder}/"]`).length === 0) {
				$parentDirectorySubFoldersList.append(makeFolder(parentDirectory, folder, $wrapper));
			}
		});

		if($parentDirectorySubFoldersList.find('> [data-directory]').length === 0) {
			const $addIcon = $('<i/>', {
				'class': 'fa fa-plus',
				'aria-hidden': 'true',
			});
			const $addButton = $('<button/>', {text: ' New Folder'});
			const $addListItem = $('<li/>', {'data-directory': 'new-folder'});

			$addButton.prepend($addIcon);
			$addListItem.append($addButton);
			$parentDirectorySubFoldersList.append($addListItem);
		}

		$parentDirectorySubFoldersList.slideDown('270');
	}

	function handleInput(e) {
		e.stopPropagation();
		e.preventDefault();

		const $wrapper = e.data.wrapper;
		const $input = e.data.input;
		const $button = e.data.button;
		const $listItem = e.data.listItem;
		const val = $input.val();

		if(val) {
			$listItem.remove();
			$wrapper.trigger('addFolders', [e.data.prefix, [val]]);
		} else {
			$input.remove();
			$button.removeClass('hidden');
		}
	}

	function makeNewFolder(e) {
		e.stopPropagation();
		e.preventDefault();

		const $wrapper = e.data.wrapper;
		const $button = $(e.target);
		const $listItem = $button.parent();
		$listItem.append($('<input/>'));
		const $input = $listItem.find('input');
		const prefix = $listItem.closest('[data-prefix]').attr('data-prefix');
		
		$button.addClass('hidden');
		$input.focus();

		$input.on('blur', {wrapper: $wrapper, input: $input, button: $button, listItem: $listItem, prefix}, handleInput);
		$input.on('keypress', (evt) => {
			const keyCode = evt.keyCode || evt.which;

			if (keyCode === 13){
				$input.blur();
			}
		});
	}

	function directory(wrapper) {
		const $wrapper = $(wrapper);

		if($wrapper.prop('directoryInitialized')) {
			return;
		}

		$wrapper.on('gotFiles', {wrapper: $wrapper}, gotFiles);
		$wrapper.on('filesDeleted', {wrapper: $wrapper}, filesDeleted);
		$wrapper.on('addFolders', {wrapper: $wrapper}, addFolders);
		$wrapper.on('click', '[data-directory="new-folder"] button', {wrapper: $wrapper}, makeNewFolder);
		$wrapper.on('s3Initialized', () => {
			const rootDirectory = $wrapper.prop('rootDirectory');


			$wrapper.find('> ul').append(makeFolder(null, rootDirectory, $wrapper));
			$wrapper.trigger('getFiles', {folder: `${rootDirectory}/` || ''});
		});
		$wrapper.s3();
		$wrapper.prop('directoryInitialized', true)
	}

	$.fn.directory = function init() {
		return this.each((index, wrapper) => {
			directory(wrapper);
		});
	}
}(jQuery.noConflict());