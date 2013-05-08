/*jshint node: true, camelcase: true, eqeqeq: true, forin: true, immed: true, latedef: true, newcap: true, noarg: true, undef: true, globalstrict: true*/
/*global describe:false, it:false, mocha: false, beforeEach: false */
"use strict";

var expect = require('expect.js');

var logupHub = require('..');
var logupEmitter = require('logup-emitter');

require('./utils/collector-transport');	// Install this transport for use with JSON config

describe('Hub', function () {
	beforeEach(function () {
		// Clear old hubs, whether or not module.parent works
		if (module['logup-hub']) module['logup-hub'].uninstall();
		if (global['logup-hub']) global['logup-hub'].uninstall();
	});

	describe('.configure', function () {
		describe('minLevel', function () {
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
				expect(messages.warn).to.have.length(1);
				expect(messages.error).to.have.length(1);
			});
			it("should pick up the level if the hub is configured after attaching the logger", function () {
				var messages = {};
				var hub = logupHub.installHub(module);
				var logger = logupEmitter.createLogger(module);
				expect(logger.minLevel).to.be.above(900);

				hub.configure([
					{ type: "collector", messages: messages, minLevel: "warn" }
				]);

				expect(logger.minLevel).to.be(logupEmitter.levels.values.warn);

				logger.trace("...");
				logger.info("Hi!");
				logger.warn("Hmm?");
				logger.error("Bye!");

				expect(messages.trace).to.be.empty();
				expect(messages.info).to.be.empty();
				expect(messages.warn).to.have.length(1);
				expect(messages.error).to.have.length(1);
			});
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

					expect(messages.trace).to.have.length(1);
					expect(messages.info).to.have.length(1);
					expect(messages.warn).to.have.length(1);
					expect(messages.error).to.have.length(1);
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
					expect(messages.warn).to.have.length(1);
					expect(messages.error).to.have.length(1);
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
					expect(messages1.warn).to.have.length(1);
					expect(messages1.error).to.have.length(1);

					expect(messages2.trace).to.be.empty();
					expect(messages2.info).to.be.empty();
					expect(messages2.warn).to.be.empty();
					expect(messages2.error).to.have.length(1);
				});
			});

			describe('when a filter group has transports with different levels', function () {
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
					expect(messages1.warn).to.have.length(1);
					expect(messages1.error).to.have.length(1);

					expect(messages2.trace).to.be.empty();
					expect(messages2.info).to.have.length(1);
					expect(messages2.warn).to.have.length(1);
				});
			});
		});

		describe('packages', function () {
			if (!module.filename) {
				it("cannot test package configuration without module.filename")
				return;
			}
			it("should set different levels for configured sources", function () {
				var messages = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages, packages: "dummy: error, library: trace, common: warn" }
				]);
				var myLogger = logupEmitter.createLogger(module);
				var dummyLogger = require('./fixtures/node_modules/dummy')();
				var libraryLogger = require('./fixtures/node_modules/library')();
				var commonLogger = require('./fixtures/node_modules/library/node_modules/common')();

				expect(myLogger.minLevel).to.be.above(900);
				expect(dummyLogger.minLevel).to.be(logupEmitter.levels.values.error);
				expect(libraryLogger.minLevel).to.be(logupEmitter.levels.values.trace);
				expect(commonLogger.minLevel).to.be(logupEmitter.levels.values.warn);
			});
			it("should respect minLevel from parent groups", function () {
				var messages1 = {};
				var messages2 = {};
				var hub = logupHub.configureHub(module, [
						{
							type: "filter", minLevel: "warn",
							layers: [
								{ type: "collector", messages: messages1 },
								{ type: "collector", messages: messages2, packages: "dummy: error, library: trace, common: warn" }
							]
						}
				]);
				var myLogger = logupEmitter.createLogger(module);
				var dummyLogger = require('./fixtures/node_modules/dummy')();
				var libraryLogger = require('./fixtures/node_modules/library')();
				var commonLogger = require('./fixtures/node_modules/library/node_modules/common')();

				[myLogger, dummyLogger, libraryLogger, commonLogger].forEach(function (logger) {
					logger.trace("...");
					logger.info("Hi!");
					logger.warn("Hmm?");
					logger.error("Bye!");

					// All of the loggers should get the minimum of the unconfigured child
					expect(logger).to.have.property('minLevel', logupEmitter.levels.values.warn);
				});

				expect(messages1.trace).to.be.empty();
				expect(messages1.info).to.be.empty();

				expect(messages2.trace).to.be.empty();
				expect(messages2.info).to.be.empty();
				expect(messages1.warn).to.have.length(4);	// 1 message * 4 loggers
				expect(messages1.error).to.have.length(4);	// 1 message * 4 loggers

				expect(messages2.warn).to.have.length(2);	// One of the loggers is only error.
				expect(messages2.error).to.have.length(3);	// All three loggers are error or lower
			});


			it("should respect wildcards", function () {
				var messages1 = {}, messages2 = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages1, minLevel: "warn", package: "dummy" },
					{ type: "collector", messages: messages2, packages: "*: error, library: trace, common: warn" }
				]);
				var myLogger = logupEmitter.createLogger(module);
				var dummyLogger = require('./fixtures/node_modules/dummy')();
				var libraryLogger = require('./fixtures/node_modules/library')();
				var commonLogger = require('./fixtures/node_modules/library/node_modules/common')();

				expect(myLogger.minLevel).to.be(logupEmitter.levels.values.error);		// Nothing but *
				expect(dummyLogger.minLevel).to.be(logupEmitter.levels.values.warn);	// Other logger
				expect(libraryLogger.minLevel).to.be(logupEmitter.levels.values.trace);	// Explicit in packages
				expect(commonLogger.minLevel).to.be(logupEmitter.levels.values.warn);	// Explicit in packages

				[myLogger, dummyLogger, libraryLogger, commonLogger].forEach(function (logger) {
					logger.trace("...");
					logger.info("Hi!");
					logger.warn("Hmm?");
					logger.error("Bye!");
				});

				expect(messages1.trace).to.be.empty();
				expect(messages1.info).to.be.empty();
				expect(messages1.warn).to.have.length(1);	// Only one logger
				expect(messages1.error).to.have.length(1);

				expect(messages2.trace).to.have.length(1);	// One package at trace
				expect(messages2.info).to.have.length(1);
				expect(messages2.warn).to.have.length(2);	// Two packages at warn
				expect(messages2.error).to.have.length(4);	// Everything
			});
		});

		describe('source', function () {
			it("should filter by custom properties", function (done) {
				var logger1 = logupEmitter.createLogger(module).describe('area', 'admin');
				var logger2 = logupEmitter.createLogger(module);

				var messages = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages, source: { area: 'admin' } }
				]);
				process.nextTick(function () {
					// Wait for loggers to attach to new hub
					expect(logger1.minLevel).to.be(0);
					expect(logger2.minLevel).to.be.above(900);


					logger1.info("Hi from admin!");
					logger2.info("Hi from guest!");

					expect(messages.info).to.have.length(1);
					expect(messages.info[0]).to.have.property('message', 'Hi from admin!');
					done();
				});
			});
			it("should filter by custom properties when the properties are configured after attaching to the hub", function () {
				var messages = {};
				var hub = logupHub.configureHub(module, [
					{ type: "collector", messages: messages, 'source-area': 'admin' }
				]);
				var logger1 = logupEmitter.createLogger(module);
				var logger2 = logupEmitter.createLogger(module);

				expect(logger1.minLevel).to.be.above(900);
				expect(logger2.minLevel).to.be.above(900);

				logger1.describe('area', 'admin');
				expect(logger1.minLevel).to.be(0);


				logger1.info("Hi from admin!");
				logger2.info("Hi from guest!");

				expect(messages.info).to.have.length(1);
				expect(messages.info[0]).to.have.property('message', 'Hi from admin!');
			});
		});
	});
});