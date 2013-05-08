/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

var LayerGroup = require('../layer-group');
var levels = require('../..').levels;

var FilterLayer = module.exports = function () {
	this.layers = new LayerGroup();
};

FilterLayer.prototype.addLayer = function (layer) {
	this.layers.addLayers([layer]);
	return this;
};

FilterLayer.prototype.getMinLevel = function (source, cb) {
	if (!this.minConfigLevel)
		return this.layers.getMinLevel(source, cb);

	// Return our minimum level, unless every
	// child layer has a higher minimum level
	var myMin = this.minConfigLevel(source);
	return this.layers.getMinLevel(
		source,
		function (childMin) { cb(Math.max(childMin, myMin)); }
	);
};

FilterLayer.prototype.writeMessage = function (source, level, timestamp, message, data) {
	// Don't forward to child layers if the
	// message is below our minimum level.
	if (this.minConfigLevel && levels.values[level] < this.minConfigLevel(source))
		return;

	this.layers.eachLayer(source, function (layer) {
		if (!layer.writeMessage)
			return;
		layer.writeMessage(source, level, timestamp, message, data);
	});
};