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
	describe('fulfillOrReject()', function() {
		it('should reject if parameter 1 is truthy', function(done) {
			promise(1).then(function() {
				this.fulfillOrReject("oh nooo");
			})
			.then(function() { assert(false); })
			.except(function(err) {
				assert(err.message == "oh nooo");
				done();
			});
		});
		it('should fulfill if parameter 1 is falsey', function(done) {
			promise(1).then(function() {
				this.fulfillOrReject(false, "oh yeaah");
			})
			.except(function() { assert(false); })
			.then(function(v) {
				assert(v == "oh yeaah");
				done();
			});
		});
		it('should fulfill if no parameters are defined', function(done) {
			promise(1).then(function() {
				this.fulfillOrReject();
			})
			.except(function() { assert(false); })
			.then(function(v) {
				assert(v === null);
				done();
			});
		});
	});
	describe('cancel()', function() {
		it('should release references of downstream promises', function() {
			var p1 = promise();
			var p2 = p1.then(function() { assert(false); });
			p2.then(function() { assert(false); });
			p1.cancel();
			assert(p1.fulfillCBs.length === 0);
			assert(p1.exceptCBs.length === 0);
			assert(p2.fulfillCBs.length === 0);
			assert(p2.exceptCBs.length === 0);
		});
	});
	describe('promise chain()ing', function() {
		it('should cause upstream fulfillment to pass down the chain', function(done) {
			var p1 = promise(), p2 = promise();
			p2.then(function(v) {
				assert(v == 'foobar');
				done();
			});
			p2.except(function() { assert(false); });
			p1.chain(p2);
			p1.fulfill('foobar');
		});
		it('should cause upstream rejection to pass down the chain', function(done) {
			var p1 = promise(), p2 = promise();
			p2.except(function(v) {
				assert(v.message == 'foobar');
				done();
			});
			p2.then(function() { assert(false); });
			p1.chain(p2);
			p1.reject('foobar');
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
		it('should create a group promise when multiple values are given', function(done) {
			var p1 = promise();
			var p2 = promise();
			var p3 = promise();
			promise(p1,p2,p3)
				.then(function(v) {
					assert(v[0] === 1);
					assert(v[1] === 2);
					assert(v[2] === 3);
					done();
				});
			p1.fulfill(1);
			p2.fulfill(2);
			p3.fulfill(3);
		});
		it('should correctly handle groups with some fulfilled', function(done) {
			var p1 = promise(1);
			var p2 = promise();
			var p3 = promise(3);
			promise(p1,p2,p3)
				.then(function(v) {
					assert(v[0] === 1);
					assert(v[1] === 2);
					assert(v[2] === 3);
					done();
				});
			p2.fulfill(2);
		});
		it('should fulfill if any except', function(done) {
			var p1 = promise();
			var p2 = promise();
			var p3 = promise();
			promise(p1,p2,p3)
				.then(function(v) {
					assert(v[0] === 1);
					assert(v[1].message == 2);
					assert(v[2] === 3);
					done();
				});
			p1.fulfill(1);
			p2.reject(2);
			p3.fulfill(3);
		});
	});
});