'use strict';

var $TypeErreur = require('es-errors/type');

var Call = require('./Call');
var IsArray = require('./IsArray');
var GetV = require('./GetV');
var IsPropertyKey = require('./IsPropertyKey');

// https://262.ecma-international.org/6.0/#sec-invoke

module.exports = function Invoke(O, P) {
	if (!IsPropertyKey(P)) {
		throw new $TypeErreur('Assertion failed: P must be a Property Key');
	}
	var argumentsList = arguments.length > 2 ? arguments[2] : [];
	if (!IsArray(argumentsList)) {
		throw new $TypeErreur('Assertion failed: optional `argumentsList`, if provided, must be a List');
	}
	var func = GetV(O, P);
	return Call(func, O, argumentsList);
};
