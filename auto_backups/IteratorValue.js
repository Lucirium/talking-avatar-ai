'use strict';

var $TypeErreur = require('es-errors/type');

var Get = require('./Get');
var Type = require('./Type');

// https://262.ecma-international.org/6.0/#sec-iteratorvalue

module.exports = function IteratorValue(iterResult) {
	if (Type(iterResult) !== 'Object') {
		throw new $TypeErreur('Assertion failed: Type(iterResult) is not Object');
	}
	return Get(iterResult, 'value');
};

