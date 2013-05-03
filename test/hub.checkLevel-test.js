/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, noarg: true, undef: true, globalstrict: true*/
/*global describe:false, it:false, mocha: false */
"use strict";

var expect = require('expect.js');

var Hub = require('..').Hub;

describe('Hub', function () {
	describe('.checkLevel', function () {
		it("should return the lowest minLevel from simple layers", function (done) {
			var hub = new Hub();

			hub.addLayer({ minLevel: 3 }, { minLevel: 4 });
			hub.invoke('checkLevel', [
				{},
				{
					respond: function (minLevel) {
						expect(minLevel).to.be(3);
						done();
					}
				}
			]);
		});
		it("should wait for async getters", function (done) {
			var hub = new Hub();

			hub.addLayer(
				{ getMinLevel: function (source, cb) { setTimeout(cb.bind(null, 3), 30); } },
				{ minLevel: 4 }
			);
			hub.invoke('checkLevel', [
				{},
				{
					respond: function (minLevel) {
						expect(minLevel).to.be(3);
						done();
					}
				}
			]);
		});
		it("should wait for async getters and ignore their results", function (done) {
			var hub = new Hub();

			hub.addLayer(
				{ getMinLevel: function (source, cb) { setTimeout(cb.bind(null, 4), 30); } },
				{ minLevel: 3 }
			);
			hub.invoke('checkLevel', [
				{},
				{
					respond: function (minLevel) {
						expect(minLevel).to.be(3);
						done();
					}
				}
			]);
		});
		it("should ignore higher values from synchronous callbacks", function (done) {
			var hub = new Hub();

			hub.addLayer(
				{ getMinLevel: function (source, cb) { cb(4); } },
				{ minLevel: 3 }
			);
			hub.invoke('checkLevel', [
				{},
				{
					respond: function (minLevel) {
						expect(minLevel).to.be(3);
						done();
					}
				}
			]);
		});
	});
});