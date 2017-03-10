/*global jQuery */
void function initSite($){
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
		const $site = $('#Site');
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
	});	
	/* eslint-enable */
}(jQuery.noConflict());