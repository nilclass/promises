
var Promise = require('../promises').Promise;

module.exports = {
  fulfilled: function(value) {
    var promise = new Promise();
    promise.fulfill(value);
    return promise;
  },

  rejected: function(reason) {
    var promise = new Promise();
    promise.reject(reason);
    return promise;
  },

  pending: function() {
    var promise = new Promise();
    return {
      promise: promise,
      reject: promise.reject.bind(promise),
      fulfill: promise.fulfill.bind(promise)
    };
  }
};