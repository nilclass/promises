// promises
// ========
// pfraze 2012

var environment = {};
if (typeof window !== "undefined") {
	environment = window;
} else if (typeof self !== "undefined") {
	environment = self;
} else if (typeof module !== "undefined") {
	environment = module.exports;
}

(function (exports) {
	function passThrough(v) { return v; }

	// Promise
	// =======
	// EXPORTED
	// Monadic function chaining around asynchronously-fulfilled values
	// - better to use the `promise` function to construct
	// - `then` and `except` functions must return a value to continue execution of the chain
	// - if an exception is thrown within a `then` function, the promise will reject with the exception as its value
	// - `then` and `except` functions are called with `this` bound to the new promise
	//   this allows asyncronous fulfillment/rejection with `this.fulfill` and `this.reject`
	function Promise(value) {
		this.fulfillCBs = [];
		this.exceptCBs = [];
		this.value = undefined;
		if (value) {
			if (value instanceof Error) {
				this.reject(value);
			} else {
				this.fulfill(value);
			}
		}
	}
	Promise.prototype.isUnfulfilled = function() { return (typeof this.value == 'undefined'); };
	Promise.prototype.isRejected = function() { return (this.value instanceof Error); };
	Promise.prototype.isFulfilled = function() { return (!this.isUnfulfilled() && !this.isRejected()); };

	// helper function to execute `then` or `except` functions
	function doThen(p, fn, args) {
		try {
			var value = fn.apply(p, [this.value].concat(args));
			if (typeof value != 'undefined') {
				if (value instanceof Error) {
					p.reject(value);
				} else {
					p.fulfill(value);
				}
			}
		}
		catch (e) {
			var err = e;
			if (!(err instanceof Error)) { err = new Error(e); }
			p.reject(err);
		}
	}

	// add a 'non-error' function to the sequence
	// - will be skipped if in 'error' mode
	Promise.prototype.then = function(fn) {
		if (this.isRejected()) {
			return this;
		} else {
			var p = promise();
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.isUnfulfilled()) {
				this.fulfillCBs.push({ p:p, fn:fn, args:args }); // run on fulfill
				this.exceptCBs.push({ p:p, fn:passThrough, args:[] });
			} else {
				doThen.call(this, p, fn, args);
			}
			return p;
		}
	};

	// add an 'error' function to the sequence
	// - will be skipped if in 'non-error' mode
	Promise.prototype.except = function(fn) {
		if (this.isFulfilled()) {
			return this;
		} else {
			var p = promise();
			var args = Array.prototype.slice.call(arguments, 1);
			if (this.isUnfulfilled()) {
				this.exceptCBs.push({ p:p, fn:fn, args:args }); // run on break
				this.fulfillCBs.push({ p:p, fn:passThrough, args:[] });
			} else {
				doThen.call(this, p, fn, args);
			}
			return p;
		}
	};

	// sets the promise value, enters 'non-error' mode, and executes any queued `then` functions
	Promise.prototype.fulfill = function(value) {
		if (this.isUnfulfilled()) {
			this.value = value;
			for (var i=0; i < this.fulfillCBs.length; i++) {
				var cb = this.fulfillCBs[i];
				doThen.call(this, cb.p, cb.fn, cb.args);
			}
			this.fulfillCBs.length = 0;
			this.exceptCBs.length = 0;
		}
	};

	// sets the promise value, enters 'error' mode, and executes any queued `except` functions
	Promise.prototype.reject = function(err) {
		if (this.isUnfulfilled()) {
			if (!(err instanceof Error)) {
				err = new Error(err);
			}
			this.value = err;
			for (var i=0; i < this.exceptCBs.length; i++) {
				var cb = this.exceptCBs[i];
				doThen.call(this, cb.p, cb.fn, cb.args);
			}
			this.fulfillCBs.length = 0;
			this.exceptCBs.length = 0;
		}
	};

	// promise creator
	// - behaves like a guard, ensuring `v` is a promise
	function promise(v) { return (v instanceof Promise) ? v : new Promise(v); }

	exports.Promise = Promise;
	exports.promise = promise;
})(environment);

if (typeof define !== "undefined") {
	define([], function() {
		return environment;
	});
}