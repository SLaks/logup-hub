/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

exports.constructors = {
};

/**
 * Gets the constructor function for a given layer name.
 * @param {String}	name			The name of the layer class to find.
 * @param {Module}	[callingModule]	The module object used to resolve unknown layer packages.  If omitted, will resolve from within logup-hub.
 */
exports.getConstructor = function (name, callingModule) {
	name = name.toLowerCase();
	if (exports.constructors.hasOwnProperty(name))
		return exports.constructors[name];

	var pkg = ((callingModule || module).require || require)("logup-transport-" + name);
	if (typeof pkg !== 'function')
		throw new Error("Package logup-transport-" + name + " (required from hub configuration) must export a transport constructor function");
	exports.constructors[name] = pkg;

	return pkg;
};

/**
 * Creates a new layer with the given name.
 * @param {String}	name			The name of the layer class to find.
 * @param {Module}	[callingModule]	The module object used to resolve unknown layer packages.  If omitted, will resolve from within logup-hub.
 **/
exports.create = function (name, callingModule) {
	var Ctor = exports.getConstructor(name, callingModule);
	return new Ctor();
};