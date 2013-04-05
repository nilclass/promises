
var promiseTests = require('promises-aplus-tests');
var adapter = require('./promises-aplus-adapter');

promiseTests(adapter, function() {
  console.log("Tests all done.");
});
