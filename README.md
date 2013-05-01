
#LogUp Hub
_One logger to rule them all_

This package is a central hub that receives log messages from all [logup-emitter](https://github.com/SLaks/logup-emitter)s beneath it in the module tree.  Use this hub in your application if you need to configure log output from libraries that use logup-emitter.


[![build status](https://secure.travis-ci.org/SLaks/logup-hub.png)](http://travis-ci.org/SLaks/logup-hub)
[![browser support](https://ci.testling.com/SLaks/logup-hub.png)](https://ci.testling.com/SLaks/logup-hub)

#About LogUp

LogUp is a simple yet powerful logging system that decouples logging from configuration.  Library packages use logup-emitter to write their logs, without needing to know where the log output is sent.  Applications can then use logup-hub to configure the log output and decides what gets sent where.

For more information about how LogUp works, see the [emitter documentation](https://github.com/SLaks/logup-emitter#about-logup).