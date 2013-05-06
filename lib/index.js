/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var myPackage = require('../package.json');

var protocolVersion = exports.protocolVersion = myPackage.protocolVersion;

var Hub = exports.Hub = require("./hub");
exports.layers = require("./layers");

/**
 * Creates a new hub
 * The caller is responsible for configuring and installing the hub.
 */
exports.createHub = function () {
	return new Hub();
};

/**
 * Creates a new hub and installs it on the given module object.
 * The caller is responsible for configuring the hub.
 */
exports.installHub = function (module) {
	var hub = new Hub();
	hub.install(module);
	return hub;
};

/**
 * Creates a new hub, initializes it with the given configuration, and installs it on the given module object.
 * The caller is responsible for nothing beyond calling this function.
 */
exports.configureHub = function (module, config) {
	var hub = new Hub();
	hub.configure(module, config);
	hub.install(module);
	return hub;
};