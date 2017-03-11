/* global jQuery, duck */

void function initRobots($, duck){
	'use strict';

	// Factory
		const RobotFactories = duck('RobotFactories');

		function validateFactoryName(e, _$factoryName) {
			if (e) {
				e.stopPropagation();
				e.preventDefault();
			}

			const $factoryName = _$factoryName || $(e.currentTarget);
			const name = $factoryName.val();

			RobotFactories.get(null, (factories) => {
				for (let i = 0, length = factories.length; i < length; i++) {
					if(!name || factories[i].name.toLowerCase() === name.toLowerCase()) {
						$factoryName.trigger('validateFactoryName', [false]);
						return;
					}
				}

				$factoryName.trigger('validateFactoryName', [true]);
			});
		}

		function initFactory(factory) {
			const $factory = $(factory);
			const $factoryName = $factory.find('[robot-factory="name"]');
			const $factoryAttributes = $factory.find('[robot-factory="attributes"]');
			//const $newfactoryAttribute = $factoryAttributes.find('[robot-factory="attribute"]').clone();
			const $saveFactory = $factory.find('[robot-factory="save"]');

			$factoryName.on('input', validateFactoryName);
			$factory.on('validateFactoryName', (e, isValid) => {
				e.stopPropagation();

				const $parent = $factoryName.parent();
				$parent.removeClass('has-success has-error');

				if(isValid) {
					$parent.addClass('has-success');
					$saveFactory.prop('disabled', false);
				} else {
					$parent.addClass('has-error');
					$saveFactory.prop('disabled', true);
				}
			});

			$factoryAttributes.on('input', '[robot-factory="attribute-name"]', (e) => {
				e.stopPropagation();
				e.preventDefault();

				const $name = $(e.currentTarget);
				const $parent = $name.parent();

				if($parent.hasClass('has-error') && $name.val()) {
					$parent.removeClass('has-error');
				}
			});
		}

		$(() => {
			initFactory("[robot-factory='factory']");
			/*const $attributes = $('.js-attributes');
			const $addAttribute = $('#AddAttribute');
			const $newAttribute = $('.js-attribute').first().clone();
			
			const $save = $('#SaveFactory');
			


			$attributes.on('input', '.js-attribute-name', (e) => {
				e.stopPropagation();
				e.preventDefault();

				const $name = $(e.currentTarget);
				const $parent = $name.parent();

				if($parent.hasClass('has-error') && $name.val()) {
					$parent.removeClass('has-error');
				}
			});

			$attributes.on('input', '.js-attribute-type', (e) => {
				e.stopPropagation();
				e.preventDefault();

				const $type = $(e.currentTarget);
				const $attribute = $type.closest('.js-attribute');
				const $robot = $attribute.find('.js-robot');
				const val = $type.val();

				if(val === 'Robot') {
					$robot.prop('disabled', false);
					return;
				}
				$robot.prop('disabled', true)
			});

			$attributes.on('input', '.js-list select', (e) => {
				e.stopPropagation();
				e.preventDefault();

				const $list = $(e.currentTarget);
				const $attribute = $list.closest('.js-attribute');
				const $robot = $attribute.find('.js-robot');
				const val = $list.val();

				if(val === 'Robot') {
					$robot.prop('disabled', false);
					return;
				}

				$robot.prop('disabled', true)
			});

			$attributes.on('click', '.js-delete', (e) => {
				e.stopPropagation();
				e.preventDefault();

				$(e.currentTarget).closest('.js-attribute').remove();
			});

			$addAttribute.on('click', (e) => {
				e.stopPropagation();
				e.preventDefault();

				$attributes.append($newAttribute.clone());
				$attributes.last().find('.js-attribute-name').focus();
			});

			$save.on('click', (e) => {
				e.stopPropagation();
				e.preventDefault();

				if(!$factoryNameInput.val()) {
					$factoryNameInput.parent().addClass('has-error');
				}

				$save.prop('disabled', true);

				const attributes = [];
				let errors = 0;

				$attributes.find('.js-attribute').each((index, attribute) => {
					const $attribute = $(attribute);
					const $name = $attribute.find('.js-attribute-name');
					const name = $name.val();
					const isList = $attribute.find('.js-attribute-is-list').prop('checked');;
					const type = $attribute.find('.js-attribute-type').val();
					const otherRobot = $attribute.find('.js-robot').val();

					if (!name || attributes.filter((a) => a.name === name).length) {
						$name.parent().addClass('has-error');
						errors++;
						return;
					}

					const newAttribtue = {
						name,
						type: isList ? [type] : type,
						id: otherRobot, // even if the type isn't "Robot", still include this as it doesn't hurt.
					}

					attributes.push(newAttribtue);
				});

				$save.prop('disabled', false);

				if(!errors) {
					const newFactory = {
						name: $factoryNameInput.val(),
						schema: attributes
					}

					RobotFactories.add(newFactory, () => {}, (err) => {console.error(err)});
				}
			}); */
		});
}(jQuery.noConflict(), duck)

// Body

// Robot