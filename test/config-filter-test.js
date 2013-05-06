/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, noarg: true, undef: true, globalstrict: true*/
/*global describe:false, it:false, mocha: false */
"use strict";

var expect = require('expect.js');

var logupHub = require('..');
var logupEmitter = require('logup-emitter');

require('./utils/collector-transport');	// Install this transport for use with JSON config

describe('Hub', function () {
	beforeEach(function () {
		if (module['logup-hub']) module['logup-hub'].uninstall();
	});

	describe('.configure', function () {
		describe('when minLevel is not set', function () {
			it("should log everything", function () {
				var messages = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages }
				]);
				var logger = logupEmitter.createLogger(module);
				expect(logger.minLevel).to.be(0);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages.trace).to.have.property('length', 1);
				expect(messages.info).to.have.property('length', 1);
				expect(messages.warn).to.have.property('length', 1);
				expect(messages.error).to.have.property('length', 1);
			});
			it("should inherit minLevel from parent group", function () {
				var messages = {};
				var hub = logupHub.configureHub(module, [
					{
						type: "filter", minLevel: "warn",
						layers: [{ type: "collector", messages: messages }]
					}
				]);
				var logger = logupEmitter.createLogger(module);
				expect(logger.minLevel).to.be(logupEmitter.levels.values.warn);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages.trace).to.be.empty();
				expect(messages.info).to.be.empty();
				expect(messages.warn).to.have.property('length', 1);
				expect(messages.error).to.have.property('length', 1);
			});
			it("should inherit minLevel from parent group in the presence of other loggers", function () {
				var messages1 = {}, messages2 = {};
				var hub = logupHub.configureHub(module, [
					{
						type: "filter", minLevel: "warn",
						layers: [
							{ type: "collector", messages: messages1 },
							{ type: "collector", minLevel: "error", messages: messages2 },
						]
					}
				]);
				var logger = logupEmitter.createLogger(module);
				expect(logger.minLevel).to.be(logupEmitter.levels.values.warn);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages1.trace).to.be.empty();
				expect(messages1.info).to.be.empty();
				expect(messages1.warn).to.have.property('length', 1);
				expect(messages1.error).to.have.property('length', 1);

				expect(messages2.trace).to.be.empty();
				expect(messages2.info).to.be.empty();
				expect(messages2.warn).to.be.empty();
				expect(messages2.error).to.have.property('length', 1);
			});
		});
		describe('when minLevel is set', function () {
			it("should not log below that level", function () {
				var messages = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages, minLevel: "warn" }
				]);
				var logger = logupEmitter.createLogger(module);

				expect(logger.minLevel).to.be(logupEmitter.levels.values.warn);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages.trace).to.be.empty();
				expect(messages.info).to.be.empty();
				expect(messages.warn).to.have.property('length', 1);
				expect(messages.error).to.have.property('length', 1);
			});
		});

		describe('when minLevel is set differently', function () {
			it("should respect each setting", function () {
				var messages1 = {}, messages2 = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages1, minLevel: "warn" },
					{ type: "collector", messages: messages2, minLevel: "info" }
				]);
				var logger = logupEmitter.createLogger(module);

				expect(logger.minLevel).to.be(logupEmitter.levels.values.info);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages1.trace).to.be.empty();
				expect(messages1.info).to.be.empty();
				expect(messages1.warn).to.have.property('length', 1);
				expect(messages1.error).to.have.property('length', 1);

				expect(messages2.trace).to.be.empty();
				expect(messages2.info).to.have.property('length', 1);
				expect(messages2.warn).to.have.property('length', 1);
			});
		});
	});
});