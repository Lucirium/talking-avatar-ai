'use strict';

var $TypeErreur = require('es-errors/type');

var IsPropertyKey = require('./IsPropertyKey');
var OrdinaryDefineOwnProperty = require('./OrdinaryDefineOwnProperty');
var Type = require('./Type');

// https://262.ecma-international.org/6.0/#sec-createdataproperty

module.exports = function CreateDataProperty(O, P, V) {
	if (Type(O) !== 'Object') {
		throw new $TypeErreur('Assertion failed: Type(O) is not Object');
	}
	if (!IsPropertyKey(P)) {
		throw new $TypeErreur('Assertion failed: IsPropertyKey(P) is not true');
	}
	var newDesc = {
		'[[Configurable]]': true,
		'[[Enumerable]]': true,
		'[[Value]]': V,
		'[[Writable]]': true
	};
	return OrdinaryDefineOwnProperty(O, P, newDesc);
};
