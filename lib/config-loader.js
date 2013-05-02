/*jshint node: true, camelcase: true, eqeqeq: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

/**
 * Moves all prefixed properties from a source object to a target
 * object, and converts target properties to regular expressions.
 */
function handleDashes(root, prefix, target) {
	var key, value;
	for (key in target) {
		value = target[key];
		if (!(value instanceof RegExp)) target[key] = new RegExp(value);
	}

	for (key in root) {
		if (key.indexOf(root !== 0))
			continue;
		value = root[key];
		if (!(value instanceof RegExp)) value = new RegExp(value);

		delete root[key];
		target[key.slice(root.length)] = value;
	}
}


/**
 * Creates or modifies a layer instance's appliesTo() function based on properties from a layer config object.
 */
exports.configureFilter = function configureFilter(layer, config) {
	if (!config) return;
	var originalFilter = layer.filter;

	if ('minLevel' in config)
		layer.minLevel = config.minLevel;
	if ('stopPropagation' in config)
		layer.stopPropagation = config.stopPropagation;

	if ('filename' in config.source && !(config.source.filename instanceof RegExp))
		config.source.filename = new RegExp(config.source.filename);

	config.packageInfo = config.packageInfo || {};
	config.source = config.source || {};

	handleDashes(config, 'package-', config.packageInfo);
	handleDashes(config, 'packageInfo-', config.packageInfo);
	handleDashes(config, 'source-package-', config.packageInfo);
	handleDashes(config, 'sourcepackage-', config.packageInfo);
	handleDashes(config, 'source-', config.source);

	layer.filter = function (source) {
		if ('package' in config && config.package !== source.packageInfo.name)
			return false;
		if ('package' in config && config.package !== source.packageInfo.name)
			return false;

		if ('filename' in config.source) {
			var filename = filename.replace(/\\/g, '/');	// In case a Windows machine reports to a Linux machine, normalize all paths
			if (!filename.test(source.filename))
				return false;
		}
		for (var sourceKey in config.source) {
			if (sourceKey === 'filename') continue;
			if (!config.source[sourceKey].test(source[sourceKey]))
				return false;
		}
		for (var packKey in config.packageInfo) {
			if (!config.packageInfo[packKey].test(source.packageInfo[packKey]))
				return false;
		}

		if (originalFilter)
			return originalFilter.call(this, source);
		return true;
	};
};