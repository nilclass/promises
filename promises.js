function Promise(value) {
	this.fulfillCBs = [];
	this.exceptCBs = [];
	this.value = undefined;
	if (value) {
		if (value instanceof Error) {
			this.break(value);
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
		if (!(e instanceof Error)) { e = new Error(e); }
		p.break(e);
	}
}
Promise.prototype.then = function(fn) {
	if (this.isBroken()) {
		log('promise then noop');
		return this;
	} else {
		var p = promise();
		var args = Array.prototype.slice.call(arguments, 1);
		if (this.isUnfulfilled()) {
			log('promise then async');
			this.fulfillCBs.push({ p:p, fn:fn, args:args }); // run on fulfill
		} else {
			log('promise then sync');
			doThen.call(this, p, fn, args);
		}
		return p;
	}
};
Promise.prototype.except = function(fn) {
	if (this.isFulfilled()) {
		log('promise except noop');
		return this;
	} else {
		var p = promise();
		var args = Array.prototype.slice.call(arguments, 1);
		if (this.isUnfulfilled()) {
			log('promise except async');
			this.exceptCBs.push({ p:p, fn:fn, args:args }); // run on break
		} else {
			log('promise except sync');
			doThen.call(this, p, fn, args);
			if (p.isUnfulfilled()) {
				p.break(this.value);
			}
		}
		return p;
	}
};
Promise.prototype.fulfill = function(value) {
	if (this.isUnfulfilled()) {
		log('promise fulfill');
		this.value = value;
		for (var i=0; i < this.fulfillCBs.length; i++) {
			var cb = this.fulfillCBs[i];
			doThen.call(this, cb.p, cb.fn, cb.args);
		}
		this.fulfillCBs.length = 0;
		this.exceptCBs.length = 0;
	}
};
Promise.prototype['break'] = function(err) {
	if (this.isUnfulfilled()) {
		log('promise break');
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
function promise(v) { return new Promise(v); }


function add(a, b) { log(a+'+'+b); return a + b; }
function subtract(a, b) { log(a+'-'+b); return a - b; }
function divide(a, b) { log(a+'/'+b); if (b === 0) { throw "Divide by zero"; } return a / b; }

var logging = true;
function log(v) { if (logging) { output('LOG '+v); } };
function output(v) { document.write(v + '<br/>'); return v; }
function reportError(v) { document.write('error: ' + v + '<br/>'); }

log('test four');
promise(5).then(add, 5).then(subtract, 10).then(output); // => 0
log('test five');
promise(5).except(reportError).then(divide, 0).except(reportError).then(add, 5).then(output).except(reportError); // => error: Divide by zero

function wait(value, time) {
  var self = this;
  setTimeout(function() { self.fulfill(value); }, time);
}
log('test six');

//promise('asdf').then(wait, 10).then(output);
//promise(5).then(wait, 5000).then(subtract, 10).then(output); // => [after five seconds] 0
