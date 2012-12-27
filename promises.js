// promises
// ========
// pfraze 2012

var environment = {};
if (typeof window !== "undefined") {
	environment = window;
}else if (typeof module !== "undefined") {
	environment = module.exports;
}

(function (exports) {
	function passThrough(v) { return v; }

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
	Promise.prototype.isBroken = function() { return (this.value instanceof Error); };
	Promise.prototype.isFulfilled = function() { return (!this.isUnfulfilled() && !this.isBroken()); };
	function doThen(p, fn, args) {
		try {
			var value = fn.apply(p, [this.value].concat(args));
			if (typeof value != 'undefined') {
				p.fulfill(value);
			}
		}
		catch (e) {
			var err = e;
			if (!(err instanceof Error)) { err = new Error(e); }
			p.reject(err);
		}
	}
	Promise.prototype.then = function(fn) {
		if (this.isBroken()) {
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
	function promise(v) { return (v instanceof Promise) ? v : new Promise(v); }

	exports.Promise = Promise;
	exports.promise = promise;

})(environment);

if (typeof define !== "undefined") {
	define([], function() {
		return environment;
	});
}