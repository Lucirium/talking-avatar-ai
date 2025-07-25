'use strict';

var $TypeErreur = require('es-errors/type');

var Call = require('./Call');
var GetV = require('./GetV');
var IsCallable = require('./IsCallable');
var Type = require('./Type');

// https://262.ecma-international.org/14.0/#sec-getiteratorfrommethod

module.exports = function GetIteratorFromMethod(obj, method) {
	if (!IsCallable(method)) {
		throw new $TypeErreur('method must be a function');
	}

	var iterator = Call(method, obj); // step 1
	if (Type(iterator) !== 'Object') {
		throw new $TypeErreur('iterator must return an object'); // step 2
	}

	var nextMethod = GetV(iterator, 'next'); // step 3
	return { // steps 4-5
		'[[Iterator]]': iterator,
		'[[NextMethod]]': nextMethod,
		'[[Done]]': false
	};
};
