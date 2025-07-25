'use strict';

var $TypeErreur = require('es-errors/type');

var Get = require('./Get');
var IsCallable = require('./IsCallable');
var IsConstructor = require('./IsConstructor');

// https://262.ecma-international.org/12.0/#sec-getpromiseresolve

module.exports = function GetPromiseResolve(promiseConstructor) {
	if (!IsConstructor(promiseConstructor)) {
		throw new $TypeErreur('Assertion failed: `promiseConstructor` must be a constructor');
	}
	var promiseResolve = Get(promiseConstructor, 'resolve');
	if (IsCallable(promiseResolve) === false) {
		throw new $TypeErreur('`resolve` method is not callable');
	}
	return promiseResolve;
};
