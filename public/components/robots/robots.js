/* global jQuery, duck */

void function initRobots($, duck){
	'use strict';

	// Factory
		const RobotFactories = duck('RobotFactories');

		function validateFactoryName(e) {
			const $factoryName = e.data.factoryName;
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

		function validateFactoryAttributeName(e) {
			e.stopPropagation();
			e.preventDefault();

			const $name = $(e.currentTarget);
			const $parent = $name.parent();

			if($parent.hasClass('has-error') && $name.val()) {
				$parent.removeClass('has-error');
			}
		}

		function checkFactoryAttributeType(e) {
			e.stopPropagation();
			e.preventDefault();

			const $type = $(e.currentTarget);
			const $attribute = $type.closest('[robot-factory="attribute"]');
			const $robot = $attribute.find('[robot-factory="attribute-robot"]');
			const val = $type.val();

			if(val === 'Robot') {
				$robot.prop('disabled', false);
				return;
			}
			$robot.prop('disabled', true);
		}

		function deleteFactoryAttribute(e) {
			e.stopPropagation();
			e.preventDefault();

			$(e.currentTarget).closest('[robot-factory="attribute"]').remove();
		}

		function addFactoryAttribute(e) {
			e.stopPropagation();
			e.preventDefault();

			const $factoryAttributes = e.data.factoryAttributes;
			const $newFactoryAttribute = e.data.newFactoryAttribute;

			$factoryAttributes.append($newFactoryAttribute.clone());
			$factoryAttributes.last().find('[robot-factory="attribute-name"]').focus();
		}

		function buildFactory(e) {
			e.stopPropagation();
			e.preventDefault();

			const $factory = e.data.factory
			const $factoryAttributes = e.data.factoryAttributes;
			const attributes = [];
			let errors = 0;

			$factoryAttributes.find('[robot-factory="attribute"]').each((index, attribute) => {
				const $attribute = $(attribute);
				const $name = $attribute.find('[robot-factory="attribute-name"]');
				const name = $name.val();
				const isList = $attribute.find('[robot-factory="attribute-is-list"]').prop('checked');
				const type = $attribute.find('[robot-factory="attribute-type"]').val();
				const otherRobot = $attribute.find('[robot-factory="attribute-robot"]').val();

				if (!name || attributes.filter((a) => a.name === name).length) {
					$name.parent().addClass('has-error');
					errors++;
					$factory.prop('builtFactory', false).trigger('factoryBuilt');
					return;
				}

				const newAttribtue = {
					name,
					type: isList ? [type] : type,
					id: otherRobot, // even if the type isn't "Robot", still include this as it doesn't hurt.
				}

				attributes.push(newAttribtue);
			});

			$factory.prop('builtFactory', attributes).trigger('factoryBuilt');
		}

		function saveFactory(e) {
			e.stopPropagation();
			e.preventDefault();

			const $factory = e.data.factory;
			const $factoryName = e.data.factoryName;
			const $saveFactory = e.data.saveFactory;
			
			$saveFactory.prop('disabled', true).trigger('buildFactory');

			const attributes = $factory.prop('builtFactory');

			if(attributes) {
				const newFactory = {
					name: $factoryName.val(),
					schema: attributes,
				}

				RobotFactories.add(newFactory, $.noop, $.noop);
			}

			$saveFactory.prop('disabled', false);
		}

		function initFactory(factory) {
			const $factory = $(factory);
			const $factoryName = $factory.find('[robot-factory="name"]');
			const $factoryAttributes = $factory.find('[robot-factory="attributes"]');
			const $addFactoryAttribute = $factory.find('[robot-factory="attribute-add"]');
			const $newFactoryAttribute = $factoryAttributes.find('[robot-factory="attribute"]').clone();
			const $saveFactory = $factory.find('[robot-factory="save"]');

			$factoryName.on('input', {factoryName: $factoryName}, validateFactoryName);
			$factory.on('buildFactory', {factory: $factory, factoryAttributes: $factoryAttributes}, buildFactory);
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

			$factoryAttributes.on('input', '[robot-factory="attribute-name"]', validateFactoryAttributeName);
			$factoryAttributes.on('input', '[robot-factory="attribute-type"]', checkFactoryAttributeType);
			$factoryAttributes.on('click', '[robot-factory="attribute-delete"]', deleteFactoryAttribute);

			$addFactoryAttribute.on('click', {factoryAttributes: $factoryAttributes, newFactoryAttribute: $newFactoryAttribute}, addFactoryAttribute);

			$saveFactory.on('click', {factory: $factory, factoryName: $factoryName, saveFactory: $saveFactory}, saveFactory);
		}

		$(() => {
			initFactory("[robot-factory='factory']");
		});

	// Robot
		//const $site = $('#Noodles');

		//$site.on('')
}(jQuery.noConflict(), duck)

// Body

