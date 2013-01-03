var promise = require('../promises').promise;
var Promise = require('../promises').Promise;
var assert = require('assert');

describe('promise', function() {
	describe('then() sequence', function() {
		it('should run fulfilled syncronous functions in order', function(done) {
			promise(1).then(function(v) {
				assert(v == 1);
				return 2;
			})
			.then(function(v) {
				assert(v == 2);
				return 3;
			})
			.except(function(err) {
				assert(false); // should never run
			})
			.then(function(v) {
				assert(v == 3);
				done();
			});
		});
		it('should delay execution of sequence until fulfillment', function(done) {
			var p = promise();
			var a = 0;
			p.then(function(v) {
				assert(v == 1);
				return 2;
			})
			.then(function(v) {
				assert(v == 2);
				return 3;
			})
			.except(function(err) {
				assert(false); // should never run
			})
			.then(function(v) {
				assert(v == 3);
				a = 1;
				done();
			});
			assert(a === 0);
			p.fulfill(1);
		});
		it('should delay execution of an intermediary step until fulfillment', function(done) {
			promise(1).then(function(v) {
				assert(v == 1);
				return 2;
			})
			.then(function(v) {
				assert(v == 2);
				var self = this;
				setTimeout(function() { self.fulfill(3); }, 1);
			})
			.except(function(err) {
				assert(false); // should never run
			})
			.then(function(v) {
				assert(v == 3);
				done();
			});
		});
	});
	describe('except() handling', function() {
		it('should switch to except functions on error', function(done) {
			promise(1).then(function(v) {
				assert(v == 1);
				return 2;
			})
			.then(function(v) {
				this.reject("oh nooo");
			})
			.except(function(err) {
				assert(err.message == "oh nooo");
				return err;
			})
			.then(function(v) {
				assert(false); // should never run
			})
			.except(function() {
				done();
			});
		});
		it('should switch to except functions on error with async', function(done) {
			var p = promise();
			p.then(function(v) {
				assert(v == 1);
				return 2;
			})
			.then(function(v) {
				return new Error("oh nooo");
			})
			.except(function(err) {
				assert(err.message == "oh nooo");
				return err;
			})
			.then(function(v) {
				assert(false); // should never run
			})
			.except(function() {
				done();
			});
			p.fulfill(1);
		});
	});
	describe('the promise() constructor', function() {
		it('should create a promise out of a non-promise', function(done) {
			promise('foobar').then(function(v) { assert(v == 'foobar'); done(); });
		});
		it('should return the input when it is a promise', function(done) {
			var p = promise('foobar');
			promise(p).then(function(v) { assert(v == 'foobar'); done(); });
		});
	});
});