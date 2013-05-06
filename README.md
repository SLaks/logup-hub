
#LogUp Hub
_One logger to rule them all_

This package is a central hub that receives log messages from all [logup-emitter](https://github.com/SLaks/logup-emitter)s beneath it in the module tree.  Use this hub in your application if you need to configure log output from libraries that use logup-emitter.


[![build status](https://secure.travis-ci.org/SLaks/logup-hub.png)](http://travis-ci.org/SLaks/logup-hub)
[![browser support](https://ci.testling.com/SLaks/logup-hub.png)](https://ci.testling.com/SLaks/logup-hub)

#About LogUp

LogUp is a simple yet powerful logging system that decouples logging from configuration.  Library packages use logup-emitter to write their logs, without needing to know where the log output is sent.  Applications can then use logup-hub to configure the log output and decides what gets sent where.

For more information about how LogUp works, see the [emitter documentation](https://github.com/SLaks/logup-emitter#about-logup).

#Configuring hub output
A LogUp hub has a collection of transports that deliver logged messages to various endpoints.  These transports are configured as a set of layers that can handle or modify each message.

Layers are typically configured using a JSON array of layer configuration objects.

For example:

```json
[
	{ "type": "console",
	  "minLevel": "warn"
	},
	{ "type": "file",
	  "package": "socket.io",
	  "minLevel": "trace",
	  "filename": "socket.io-trace.log"
	},
	{ "type": "file",
	  "source-filename": "/utils\.js$",
	  "minLevel": "trace",
	  "filename": "util junk.log",
	  "stopPropagation": "true"
	},
	{ "type": "file",
	  "packages": "socket.io: info, mysql: warn, stripe: trace, oauth: error",
	  "filename": "interesting events.log"
	},
	{ "type": "filter",
	  "package-author": "SLaks",
	  "minLevel": "trace",
	  "layers": [
		  { "type": "file",
			"slaks-packages.trace.log"
		  },
		  { "type": "email",
			"minLevel": "error",
			...
		  }
	  ]
	}
]
```

All layers can have filtering options applied; these will limit that layer to only receive messages from sources that match the filter.  

To apply filtering to multiple layers, use a `"type": "filter"` layer, which can contain one or more child layers and will only send messages to its child layers if they meet the parent filter.