/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var levels = require('logup-emitter').levels;
var LayerGroup = require('./layer-group');
var configLoader = require('./config-loader');

/**
 * A simple logging hub that is used if no host could be found.
 */
var Hub = module.exports = function () {
	this.emitters = [];
	this.layers = new LayerGroup();
};

/////////////////////////////////////////////////////
/// Public API

/**
 * Installs this hub onto a module object.
 * After calling this function, any emitters created on 
 * child modules will attach themselves to this hub.
 */
Hub.prototype.install = function (targetModule) {
	// Browserify doesn't support module.parent at
	// all.  Check for that on our module, in case
	// the caller's module is actually the root.
	if (!module.parent) {
		targetModule = global;
	}

	if (targetModule['logup-hub'] !== void 0)
		throw new Error("Module " + targetModule.id + " already has a LogUp hub installed");
	targetModule["logup-hub"] = this;
	this.module = targetModule;
};
/**
 * Uninstalls this hub from the module it was installed on.
 */
Hub.prototype.uninstall = function () {
	if (!this.module || this.module['logup-hub'] !== this)
		throw new Error("This hub is not installed");

	try {
		delete this.module['logup-hub'];
	} catch (e) {
		this.module['logup-hub'] = void 0;	// Workaround for IE8 bug when deleting from window (if no module.parent)
	}
	delete this.module;
};

/**
 * Adds one or more output layers to this hub
 **/
Hub.prototype.addLayer = function (layer) {
	this.layers.addLayers(arguments);
	this.broadcast('configChanged', '*', []);
};

/**
 * Loads and applies configuration into this hub.
 * @param {Module} [callingModule]	The module to load the configuration data relative to.  (optional)
 *									This is used to resolve transport packages and relative paths to JSON files.
 * @param {Any}		config			The configuration to load.
 *									This can be a path to a require()-able JS/JSON file (relative to module) or an array of layer config objects and/or layer instances.
 */
Hub.prototype.configure = function (callingModule, config) {
	if (arguments.length === 1) {
		if ("exports" in callingModule)	// If we were only passed a module, complain
			throw new Error("configure() must be passed a config object");
		config = callingModule;
		callingModule = null;
	} else if ("exports" in config && !("exports" in callingModule)) {
		// If the parameters were passed backwards, swap them
		var tmp = callingModule;
		config = callingModule;
		callingModule = tmp;
	}

	if (typeof config === 'string') {
		if (typeof callingModule.require !== 'function')
			throw new Error("Cannot pass path to config file without also passing callingModule with require()");
		config = callingModule.require(config);
		if (typeof config !== "object")	// arguments[2] won't return the value we assigned to the param, except in browsers that don't support "use strict"
			throw new Error("Config file '" + arguments[2] + "' didn't export an object");
	}

	if (!Array.isArray(config))
		config = config.layers;

	if (!Array.isArray(config))
		throw new Error("Config must contain an array of layers");

	this.layers.addLayers(config.map(function (obj) {
		return configLoader.createLayer(obj, callingModule);
	}));

	this.broadcast('configChanged', '*', []);
};

/////////////////////////////////////////////////////
/// Internal API


/**
 * Sends a broadcast to all registered emitters.
 * See logup-emitter/protocol.md for details.
 */
Hub.prototype.broadcast = function (name, versionRange, args) {
	for (var i = 0; i < this.emitters.length; i++) {
		this.emitters[i].onBroadcast(name, versionRange, args);
	}
};

/////////////////////////////////////////////////////
/// Emitter-facing API

/**
 * Attaches an emitter (logger or proxy) to this hub.
 */
Hub.prototype.attach = function (emitter) {
	this.emitters.push(emitter);
};

/**
 * Invokes a method on the hub.
 */
Hub.prototype.invoke = function (method, args) {
	this[method].apply(this, args);
};

/////////////////////////////////////////////////////
/// invoke()-able methods
Hub.prototype.checkLevel = function (source, e) {
	this.layers.getMinLevel(source, e.respond.bind(e));
};

Hub.prototype.log = function (source, level, timestamp, message, data) {
	this.layers.eachLayer(source, function (layer) {
		if (!layer.writeMessage)
			return;
		layer.writeMessage(source, level, timestamp, message, data);
	});
};
