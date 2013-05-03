/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: false, newcap: true, noarg: true, undef: true, globalstrict: true*/
"use strict";

/**
 * A nestable collection of output layers (log transports or filters).
 */
var LayerGroup = module.exports = function () {
	this.layers = [];
};


/**
 * Adds an array layers to this group
 **/
LayerGroup.prototype.addLayers = function (layers) {
	this.layers.push.apply(this.layers, layers);
};

/**
 * Iterates through all layers that apply to a given source, running a callback for each one.
 * @param {object}			source		The logger source object to filter layers by.
 * @param {Boolean}			[recurse]	If false, will not recurse into nested groups.  True by default.
 * @param {Function(layer)}	cb			A callback to run on each matching source.
 */
LayerGroup.prototype.eachLayer = function (source, recurse, cb) {
	if (arguments.length === 2) {
		cb = recurse;
		recurse = true;
	}
	for (var i = 0; i < this.layers.length; i++) {
		if (this.layers[i].appliesTo && !this.layers[i].appliesTo(source))
			continue;

		cb(this.layers[i]);

		if (recurse && this.layers[i].eachLayer)
			this.layers[i].eachLayer(source, cb);

		if (this.layers[i].stopPropagation)
			return;
	}
};

LayerGroup.prototype.getMinLevel = function (source, cb) {
	var waitingCalls = 1;	// Start at 1 while in the enumeration (to prevent a synchronous callback from returning immediately)
	var result = 999;

	function layerCb(minLevel) {
		waitingCalls--;
		result = Math.min(result, minLevel);
		if (waitingCalls === 0)
			cb(result);
	}
	this.eachLayer(source, false, function (layer) {
		if (layer.getMinLevel) {
			waitingCalls++;
			layer.getMinLevel(source, layerCb);
			return;
		}

		if ('minLevel' in layer)
			result = Math.min(result, layer.minLevel);
	});

	waitingCalls--;

	// If nothing was async, reply immediately.
	if (waitingCalls === 0)
		cb(result);
};
