/*jshint node: true, camelcase: true, eqeqeq: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var layers = require('./layers');

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
 * Creates a layer instance from a configuration object.
 * @param {Object}	config			A configuration object (typically from JSON) describing the layer to create.
 * @param {Module}	[callingModule]	A module object used to resolve unknown layer packages.  If omitted, will resolve from within logup-hub.
 */
exports.createLayer = function createLayer(config, callingModule) {
	var layer = layers.create(config.type, callingModule);
	exports.applyConfig(layer, config, callingModule);
};

/**
 * Modifies a layer instance in accordance with a config object.
 * Creates or modifies a layer instance's appliesTo() function based on properties from a layer config object.
 * 
 * @param {Layer}	layer			The existing layer instance to configure.
 * @param {Object}	config			A configuration object (typically from JSON) describing the configuration to apply.
 * @param {Module}	[callingModule]	A module object used to resolve unknown layer packages for nested layers.  If omitted, will resolve from within logup-hub.
 */
exports.applyConfig = function configureLayer(layer, config, callingModule) {
	if (!config) return;

	if ('layers' in config) {
		if (!layer.addLayer)
			throw new Error("Layer " + layer + " does not support nested layers");
		for (var i = 0; i < config.layers.length; i++) {
			layer.addLayer(exports.createLayer(config.layers[i], callingModule));
		}
	}

	if ('minLevel' in config) {
		if (typeof config.minLevel === "string")
			layer.minLevel = require('logup-emitter').levels.values[config.minLevel];
		else
			layer.minLevel = config.minLevel;
	}
	if ('stopPropagation' in config)
		layer.stopPropagation = config.stopPropagation;

	config.packageInfo = config.packageInfo || {};
	config.source = config.source || {};

	handleDashes(config, 'package-', config.packageInfo);
	handleDashes(config, 'packageInfo-', config.packageInfo);
	handleDashes(config, 'source-package-', config.packageInfo);
	handleDashes(config, 'sourcepackage-', config.packageInfo);
	handleDashes(config, 'source-', config.source);

	var originalFilter = layer.appliesTo;
	layer.appliesTo = function (source) {
		if ('package' in config && config.package !== source.packageInfo.name)
			return false;

		if ('filename' in config.source) {
			var filename = filename.replace(/\\/g, '/');	// In case a Windows machine reports to a Linux machine, normalize all paths
			if (!config.source.filename.test(source.filename))
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