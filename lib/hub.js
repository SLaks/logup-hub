/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var levels = require('logup-emitter').levels;
var util = require('./util');

/**
 * A simple logging hub that is used if no host could be found.
 */
var Hub = module.exports = function StubHub() {
	this.emitters = [];
};

/////////////////////////////////////////////////////
/// Public API

/**
 * Installs this hub onto a module object.
 * After calling this function, any emitters created on child modules
 * will attach themselves to this hub.
 */
Hub.prototype.install = function (module) {
	if ("logup-hub" in module)
		throw new Error("Module " + module.id + " already has a LogUp hub installed");
	module["logup-hub"] = this;
};

/////////////////////////////////////////////////////
/// Internal API

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
	// TODO: Forward to middleware
	e.respond(this.minLevel);
};

Hub.prototype.log = function (source, level, timestamp, message, data) {
	// TODO: Forward to middleware
};
