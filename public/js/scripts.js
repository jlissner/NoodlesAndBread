/*global jQuery, CodeMirror, SimpleMDE */
void function initSite($, CodeMirror, SimpleMDE){
	'use strict'

	function registerHome(e, home, _$home) {
		const $site = e.data.site;
		const $home = _$home || $site.find(`[robot-home='${home}']`);

		if($home.length !== 1) {
			$site.trigger('containerRegistered', [`Multiple homes with the same name. Home name: ${home}`]);
			return;
		}
		const homes = $site.prop('registeredHomes');
		homes[home] = $home;

		$site.prop('registeredHomes', homes)
		$site.trigger('homeRegistered');
	}

	function registerHomes(e) {
		const $site = e.data.site;
		const $homes = $site.find('[robot-home]');

		$homes.each((index, _home) => {
			const $home = $(_home);
			const home = $home.attr('robot-home');

			if(!home || ($site.prop('registeredHomes')[home] && $site.prop('registeredHomes')[home] === $home)) {
				return;
			}

			$site.trigger('registerHome', [home, $home]);
		});

		$site.trigger('homesRegistered');
	}

	function loadRobot(e, robot, params) {
		const $site = e.data.site;
		const $home = $site.prop('registeredHomes')[robot.home];

		if (!$home.prop('defaultContentRemoved')) {
			$home.prop('defaultContent', ($(`<div>${$home.html()}</div>` || '<div></div>')));
			$home.html('');
			$home.prop('defaultContentRemoved', true);
		}

		const $temp = $home.prop('defaultContent');

		$home.append($temp);

		$.ajax({
			url: '/robot/get',
			data: {robot, params},
			success: (data) => {
				$temp.after(data);
				$temp.remove();
				$site.trigger('robotLoaded', [null, robot]);
			},
			error: (err) => {
				$site.trigger('robotLoaded', [err]);
			},
		});
	}

	function loadRobots(e, robots, params) {
		e.stopPropagation();

		const $site = e.data.site;

		robots.forEach((robot) => {
			$site.trigger('loadRobot', [robot, params]);
		});
	}

	$(() => {
		const $site = $('#Noodles');
		$site.prop('registeredHomes', $site.prop('registeredHomes') || []);

		$site.on('loadRobots', {site: $site}, loadRobots);
		$site.on('loadRobot', {site: $site}, loadRobot);
		$site.on('registerHomes', {site: $site}, registerHomes);
		$site.on('registerHome', {site: $site}, registerHome);

		$site.trigger('registerHomes');

		// hide flash message after 1.5s
		setTimeout(() => {
			$('.flash-message-container').slideUp(1000);
		}, 1500);

		//// init 3rd Party Elements
		// init WYSIWYG
		$('.simpleMDE > textarea').each((i, simpleMDE) => {
			const $simpleMDE = $(simpleMDE);
			const _simpleMDE = new SimpleMDE({element: simpleMDE, autoDownloadFontAwesome: false});

			$simpleMDE.prop('simpleMDE', () => _simpleMDE);
		});

		// init code editor
		$('[data-function*="codemirror"]').each((i, codemirror) => {
			const $codemirror = $(codemirror);
			const val = $codemirror.text();
			$codemirror.text('');
			const $preview = $codemirror.parent().find('[data-codemirror="preview"]');
			const _codemirror = CodeMirror(codemirror, {
					smartIndent: true,
					indentWithTabs: true,
					lineNumbers: true,
					mode: $codemirror.attr('data-mode') || 'pug',
					value: val,
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

				$codemirror.on('input', (e) => {
					e.stopPropagation();
					e.preventDefault();

					clearTimeout(doPreview);
					doPreview = setTimeout(() => {
						$.ajax({
							url: '/renderPug',
							data: {pug: $codemirror.prop('codemirror').getValue(), locals: {}},
							success: (data) => {
								$preview.html(data);
							},
						});
					}, 1000)
					//if()

					
				})
			}
		});

		// init date picker
		$('.bs-date').datetimepicker({format: 'MM/DD/YYYY'});

		// init color picker
		$('input[type="color"]').spectrum({showInput: true, preferredFormat: "hex"});
	});	
	/* eslint-enable */
}(jQuery.noConflict(), CodeMirror, SimpleMDE);