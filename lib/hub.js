/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var levels = require('logup-emitter').levels;

/**
 * A simple logging hub that is used if no host could be found.
 */
var Hub = module.exports = function StubHub() {
	this.emitters = [];
	this.layers = [];
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

	if ("logup-hub" in targetModule)
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
	delete this.module["logup-hub"];
	delete this.module;
};

/**
 * Adds one or more output layers to this hub
 **/
Hub.prototype.addLayer = function (layer) {
	this.layers.push.apply(this, arguments);
	this.broadcast('configChanged', '*', []);
};

/**
 * Loads and applies configuration into this hub.
 * @param {Module} [module]	The module to load the configuration data relative to.  (optional)
 *							This is used to resolve transport packages and relative paths to JSON files.
 * @param {Any}		config	The configuration to load.
 *							This can be a path to a require()-able JS/JSON file (relative to module) or an array of layer config objects and/or layer instances.
 */
Hub.prototype.configure = function (module, config) {
};

/////////////////////////////////////////////////////
/// Internal API

/**
 * Iterates through all layers that apply to a given source, running a callback for each one.
 * @param {object}			source	The logger source object to filter layers by.
 * @param {Function(layer)}	cb		A callback to run on each matching source.
 */
Hub.prototype.eachLayer = function (source, cb) {
	for (var i = 0; i < this.layers.length; i++) {
		if (this.layers[i].appliesTo && !this.layers[i].appliesTo(source))
			continue;

		cb(this.layers[i]);

		if (this.layers[i].stopPropagation)
			return;
	}
};

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
	var waitingCalls = 1;	// Start at 1 while in the enumeration (to prevent a synchronous callback from returning immediately)
	var result = 999;

	function cb(minLevel) {
		waitingCalls--;
		result = Math.min(result, minLevel);
		if (waitingCalls === 0)
			e.respond(result);
	}
	this.eachLayer(source, function (layer) {
		if (layer.getMinLevel) {
			waitingCalls++;
			layer.getMinLevel(source, cb);
			return;
		}

		if ('minLevel' in layer)
			result = Math.min(result, layer.minLevel);
	});

	waitingCalls--;

	// If nothing was async, reply immediately.
	if (waitingCalls === 0)
		e.respond(result);
};

Hub.prototype.log = function (source, level, timestamp, message, data) {
	this.eachLayer(source, function (layer) {
		if (!layer.writeMessage)
			return;
		layer.writeMessage(source, level, timestamp, message, data);
	});
};
