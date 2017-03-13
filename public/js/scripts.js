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

	function loadRobot(e, robot) {
		const $site = e.data.site;
		const $home = $site.prop('registeredHomes')[robot.home];

		if (!$home.prop('defaultContentRemoved')) {
			$home.prop('defaultContent', $home.html())
			$home.html('');
			$home.prop('defaultContentRemoved', true);
		}

		const $temp = $($home.prop('defaultContent') || '<div></div>');

		$home.append($temp);

		$.ajax({
			url: '/robot/get',
			data: {robot},
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

	function loadRobots(e, robots) {
		e.stopPropagation();

		const $site = e.data.site;

		robots.forEach((robot) => {
			$site.trigger('loadRobot', robot);
		});

		$site.trigger('robotsLoaded');
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

		// init 3rd Party Elements
		$('.simpleMDE > textarea').each((i, simpleMDE) => {
			const $simpleMDE = $(simpleMDE);
			const _simpleMDE = new SimpleMDE({element: simpleMDE, autoDownloadFontAwesome: false});

			$simpleMDE.prop('simpleMDE', () => _simpleMDE);
		});


		// init 3rd Party Elements
		$('.codemirror').each((i, codemirror) => {
			const $codemirror = $(codemirror);
			const _codemirror = CodeMirror(codemirror, {
					smartIndent: true,
					indentWithTabs: true,
					lineNumbers: true,
					mode: $codemirror.attr('data-mode') || 'pug'
			});

			$codemirror.prop('codemirror', () => _codemirror);
		});

		$('.bs-date').datetimepicker({format: 'MM/DD/YYYY'});
		$('input[type="color"]').spectrum({showInput: true, preferredFormat: "hex"});
	});	
	/* eslint-enable */
}(jQuery.noConflict(), CodeMirror, SimpleMDE);