/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var levels = require('../..').levels;

/**
 * A simple logging hub that collects all emitted logs in arrays.
 */
var CollectorTransport = module.exports = function CollectingHub() {
	this.messages = {};
	for (var i = 0; i < levels.names.length; i++) {
		this.messages[levels.names[i]] = [];
	}
};

CollectorTransport.prototype.applyConfig = function (config, callingModule) {
	if (!config.messages) return;
	for (var level in this.messages) {
		if (!this.messages.hasOwnProperty(level)) continue;
		config.messages[level] = config.messages[level] || [];
		Array.prototype.push.apply(config.messages[level], this.messages[level]);
	}
	this.messages = config.messages;
};

CollectorTransport.prototype.writeMessage = function (source, level, timestamp, message, data) {
	this.messages[level].push({
		source: source,
		timestamp: timestamp,
		message: message,
		data: data
	});
};

require('../..').layers.constructors.collector = CollectorTransport;