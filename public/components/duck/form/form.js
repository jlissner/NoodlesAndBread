/* global jQuery, duck, SimpleMDE, CodeMirror, window */

void function initDuckForm($, duck, SimpleMDE, CodeMirror, window) {
	'use strict'

	function deleteArrayItem(e) {
		e.stopPropagation();
		e.preventDefault();
		
		$(this).closest('[duck-type]').remove();
		$(this).closest('[duck-type="array"]').trigger('duckArrayItemDeleted');
	}

	function addArrayItem(e) {
		e.stopPropagation();
		e.preventDefault();

		const $this = $(this);
		const addDirection = $this.attr('duck-add');
		const $wrapper = $this.closest('[duck-type="array"]');
		const $item = $wrapper.find('[duck-type]').first();
		const $lastItem = $item.parent().find('> [duck-type]').last();
		const $clone = $item.clone();

		switch(addDirection) {
			case 'after' : {
				$this.closest('[duck-type]').after($clone)
				break;
			}
			case 'before' : {
				$this.closest('[duck-type]').before($clone)
				break;
			}
			default : {
				$lastItem.after($clone);
				break;		
			}
		}

		$clone.find('[duck-value], [duck-type="wysiwyg"]').val(null);
		$clone.find('input[type="checkbox"], input[type="radio"]').prop('checked', false);
		$clone.find('[data-sort="item"]:not(:first-of-type)').remove();
		$clone.find('[duck-button="delete"]').click(deleteArrayItem);
		$clone.find('[duck-button="add"]').click(addArrayItem);
		$clone.find('[data-function="tabs"]').makeTabs();
		$clone.find('[data-function*="accordion"]').makeAccordion();
		$clone.find('[duck-type="code"]').each((i, _code) => {
			const $codemirror = $(_code).find('[data-function*="codemirror"]');
			$codemirror.html('')
			const codemirror = $codemirror[0];
			const $preview = $codemirror.parent().find('[data-codemirror="preview"]');
			$preview.html('');
			const _codemirror = CodeMirror(codemirror, {
					smartIndent: true,
					indentWithTabs: true,
					lineNumbers: true,
					mode: $codemirror.attr('data-mode') || 'pug',
			});

			if(!$codemirror.is(':visible')) {
				const refresh = setInterval(() => {
					if($codemirror.is(':visible')) {
						_codemirror.refresh();
						clearTimeout(refresh);
					}
				}, 250);
			}

			$codemirror.prop('codemirror', () => _codemirror);

			if($preview.length) {
				let doPreview;

				$codemirror.on('input', (_e) => {
					_e.stopPropagation();
					_e.preventDefault();

					clearTimeout(doPreview);
					doPreview = setTimeout(() => {
						$.ajax({
							url: '/renderPug',
							data: {pug: $codemirror.prop('codemirror').getValue(), locals: {}},
							success: (data) => {
								$preview.html(data);
							},
						});
					}, 1000);
				});
			}
		});
		$clone.find('[duck-image-value]').text('This isn\'t working yet.');
		$clone.find('input[type="color"]').spectrum({showInput: true, preferredFormat: "hex"});
		$clone.find('.bs-date').datetimepicker({format: 'MM/DD/YYYY'});
		$clone.find('.summernote').summernote('destroy').summernote({height: '150px'});


		$item.parent().sortable('[duck-type]');

		$wrapper.trigger('duckArrayItemAdded');
		$wrapper.closest('[data-function*="scroll"]').trigger('initScroll')
	}

	function removeFromObject(obj, path, value) {
		const pathList = typeof path === 'string' ? path.split('.') : path;
		const length = pathList.length

		for(let i = 0; i < length; i++){
			const field = pathList[i];
			const isLastItem = length === 1;
			const isObject = typeof obj[field] === 'object';

			if(isLastItem && !isObject){
				delete obj[field];
			} else if (!isObject){
				break;
			}

			const type = obj[field] instanceof Array ? 'array' : 'object';

			if(type === 'object'){
				const newPathList = pathList.slice(0);
				newPathList.splice(0, 1);

				obj[field] = removeFromObject(obj[field], newPathList, value);
			} else {
				const indexToSplice = isLastItem ?  obj[field].indexOf(value) : 
													obj[field].map((o) => o[pathList[i+1]]).indexOf(value);
				
				obj[field].splice(indexToSplice, 1)
			}
		}

		return obj;
	}

	function parseObject(obj, $item, fieldName, buildObjectFunction) {
		const key = $item.attr('duck-key');
		const newObj = obj[fieldName] || {};

		if(key && !newObj[key]){
			newObj[key] = $item.attr('duck-key-value') || duck.uuid();
		}

		obj[fieldName] = buildObjectFunction(newObj, duck.findRelevantChildren($item, '[duck-field]'));
	}

	function parseArray(obj, $item, fieldName, buildObjectFunction) {
		const $objectToUpdate = duck.findRelevantChildren($item, '[duck-type="object"]');
		const value = $objectToUpdate.first().attr('duck-key') ? obj[fieldName] || [] : [];

		if($objectToUpdate.length) {
			$objectToUpdate.each((i, objec) => {
				const $objec = $(objec);
				const key = $objec.attr('duck-key');
				const keyValue = $objec.attr('duck-key-value') || duck.uuid();
				const newObj = key ? value.filter((o) => o[key] === keyValue)[0] || {} : {}

				// if the key is defined, the object is being altered/added without the context of the other items
				if(key){
					// if the key doesn't have a preset value, give it a uuid
					newObj[key] = keyValue;

					// check to see if an item with the same key exists in the array
					const indexOfCurrentId = value.map((o) => o[key]).indexOf(newObj[key]);

					// if it does, remove it from the list of values
					if(indexOfCurrentId !== -1){
						value.splice(indexOfCurrentId, 1);
					}
				}

				// add the new object to the list of values
				value.push(buildObjectFunction(newObj, duck.findRelevantChildren($objec, '[duck-field]')));
			});
		} else {
			$item.find('[duck-value]').each((i, arrayItem) => {
				const val = $(arrayItem).val();

				if(val){
					value.push(val);
				}
			});
		}

		if(obj[fieldName] || value.length){
			obj[fieldName] = value;
		}
	}

	function parseCheckbox(obj, $item, fieldName) {
		const value = [];

		$item.find('input[type="checkbox"]').each((j, checkbox) => {
			const $checkbox = $(checkbox);

			if($checkbox.prop('checked')){
				value.push($checkbox.val());
			}
		});

		if(obj[fieldName] || value.length){
			obj[fieldName] = value;
		}
	}

	function parseRadio(obj, $item, fieldName) {
		const value = $item.find('input[type="radio"]:checked').val();

		if(obj[fieldName] || value){
			obj[fieldName] = value;
		}
	}

	function parseWysiwyg(obj, $item, fieldName) {
		const value = $item.find('.summernote').summernote('code');

		if(value){
			obj[fieldName] = value;
		}
	}

	function parseCode(obj, $item, fieldName) {
		const codemirror = $item.find('[data-function*="codemirror"]').prop('codemirror');
		const value = codemirror.getValue();

		if(value){
			obj[fieldName] = value;
		}
	}

	function buildObject(obj, $context) {
		$context.each((i, item) => {
			const $item = $(item);
			const fieldName = $item.attr('duck-field');
			const type = $item.attr('duck-type');

			switch(type){
				case 'object': {
					parseObject(obj, $item, fieldName, buildObject);

					break;
				}
				case 'array': {
					parseArray(obj, $item, fieldName, buildObject);

					break;
				}
				case 'checkbox': {
					parseCheckbox(obj, $item, fieldName);

					break;
				}
				case 'radio': {
					parseRadio(obj, $item, fieldName);

					break;
				}
				case 'bool': {
					obj[fieldName] = $item.prop('checked') || $item.find('input[type="checkbox"]').prop('checked');
					
					break;
				}
				case 'wysiwyg': {
					parseWysiwyg(obj, $item, fieldName);
					
					break;
				}
				case 'code': {
					parseCode(obj, $item, fieldName);
					
					break;
				}
				case 'image':
				case 'select': 
				case 'number': 
				case 'string':
				default: {
					const isInputValue = $item.val();
					const value = isInputValue ? isInputValue : $item.find('[duck-value]').val();

					if(obj[fieldName] || value){
						obj[fieldName] = value;
					}

					break;
				}
			}
		});

		return obj;
	}

	function addItem(table, key, keyValue, range, rangeValue, $startOfFields, successCallback, failureCallBack) {
		const item = {};
		item[key] = keyValue || duck.uuid();

		if(range) {
			item[range] = rangeValue || duck.uuid();
		}

		duck(table).add(buildObject(item, $startOfFields), successCallback, failureCallBack);
	}

	function updateItem(table, key, keyValue, range, rangeValue, $startOfFields, successCallback, failureCallBack) {
		duck(table).get({field: key, value: keyValue, findOne: true}, (data) => {
			const item = buildObject(data, $startOfFields);
			duck(table).update(item, successCallback, failureCallBack);
		});
	}

	function deleteItem(table, key, keyValue, range, rangeValue, $wrapper) {
		duck(table).delete(keyValue, () => {
			const currentLocation = window.location.href.split('/');
			const goTo = $wrapper.attr('duck-goTo');

			if(currentLocation[currentLocation.length - 1]){
				currentLocation.pop();
			} else {
				currentLocation.pop();
				currentLocation.pop();
			}

			const newLocation = goTo ? goTo : currentLocation.join('/');
			if(window.location.href === newLocation) {
				window.location.reload(true);
			} else{
				window.location.href = newLocation;
			}
		});
	}

	function deleteFieldFromItem(table, key, keyValue, $wrapper, successCallback, failureCallBack) {
		const path = $wrapper.attr('duck-delete-path');
		const value = $wrapper.attr('duck-delete-value');

		duck(table).get({field: key, value: keyValue, findOne: true}, (data) => {
			const item = removeFromObject(data, path, value);

			duck(table).update(item, successCallback, failureCallBack);
		});
	}

	function editForm(e) {
		const $wrapper = e.data.wrapper;

		$wrapper.attr('duck-edit-form', $wrapper.attr('duck-edit-form') === 'view' ? 'edit' : 'view');
		$('[data-function*="scroll"]').trigger('initScroll');
	}

	function submitForm(e) {
		e.preventDefault();
		e.stopPropagation();

		const crud = e.data.crud;
		const table = e.data.table;
		const key = e.data.key;
		const keyValue = e.data.keyValue;
		const range = e.data.range;
		const rangeValue = e.data.rangeValue;
		const $startOfFields = e.data.startOfFields;
		const $wrapper = e.data.wrapper;
		const successCallback = e.data.successCallback;
		const failureCallBack = e.data.failureCallBack;

		$(e.currentTarget).prop('disabled', true);

		switch(crud){
			// adds an item to the table
			case 'add':{
				addItem(table, key, keyValue, range, rangeValue, $startOfFields, successCallback, failureCallBack);

				break;
			}

			// updates an item from the table
			case 'update':{
				updateItem(table, key, keyValue, range, rangeValue, $startOfFields, successCallback, failureCallBack);

				break;
			}

			// deletes an item from the table
			case 'delete':{
				deleteItem(table, key, keyValue, range, rangeValue, $wrapper);

				break;
			}

			// deletes a field or value from an item in the table
			case 'deleteField':{
				deleteFieldFromItem(table, key, keyValue, range, rangeValue, $wrapper, successCallback, failureCallBack)

				break;
			}
			default:
		}
	}

	function duckForm(wrapper, options) {
		const $wrapper = $(wrapper);
		const $startOfFields = duck.findRelevantChildren($wrapper, '[duck-field]');
		const $editButton = $wrapper.find('[duck-button="edit"]');
		
		const table = (options && options.table) || $wrapper.attr('duck-table');
		const crud = (options && options.crud) || $wrapper.attr('duck-function');
		
		const key = (options && options.key) || $wrapper.attr('duck-key') || 'Id';
		const keyValue = (options && options.keyValue) || $wrapper.attr('duck-key-value');
		
		const range = (options && options.range) || $wrapper.attr('duck-range') || '_Id';
		const rangeValue = range && ((options && options.rangeValue) || $wrapper.attr('duck-range-value'));
		
		const successCallback = (options && options.successCallback) || (() => {window.location.reload(true)});
		const failureCallBack = (options && options.failureCallBack) || (() => {window.location.reload(true)});

		if(!table || !crud || !key || ((crud === 'update' || crud === 'delete') && !keyValue)) {
			throw new Error('Missing Required information.'); // need to have a table, key, and it's function set, and must have key value if it's for an update or delete
		}

		$editButton.off('click', editForm)
				.on('click', {wrapper: $wrapper}, editForm);

		// set what happens when the submit button is clicked
		$wrapper.off('click', submitForm)
				.on('click', '[duck-button="submit"]', {crud, table, key, keyValue, range, rangeValue, wrapper: $wrapper, startOfFields: $startOfFields, successCallback, failureCallBack}, submitForm);

		// set arrays to be sortable
		$wrapper.find('[duck-type="array"]')
				.each((i, item) => {
					const $item = $(item);
					const $itemChildren = duck.findRelevantChildren($item, '[duck-type]');

					$itemChildren.first().parent().sortable('[duck-type]');
				});

		// make add and delete item from array work
		$wrapper.find('[duck-button="add"]').off('click', addArrayItem).click(addArrayItem);
		$wrapper.find('[duck-button="delete"]').off('click', deleteArrayItem).click(deleteArrayItem);
	}

	$.fn.duckForm = function init(options) {
		return this.each((index, wrapper) => {
			duckForm(wrapper, options);
		});
	}

	$(() => {$('[duck-table]').duckForm();});
}(jQuery.noConflict(), duck, SimpleMDE, CodeMirror, window)