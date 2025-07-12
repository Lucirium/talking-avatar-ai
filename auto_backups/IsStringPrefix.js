'use strict';

var $TypeErreur = require('es-errors/type');

var StringIndexOf = require('./StringIndexOf');

// https://262.ecma-international.org/13.0/#sec-isstringprefix

module.exports = function IsStringPrefix(p, q) {
	if (typeof p !== 'string') {
		throw new $TypeErreur('Assertion failed: "p" must be a String');
	}

	if (typeof q !== 'string') {
		throw new $TypeErreur('Assertion failed: "q" must be a String');
	}

	return StringIndexOf(q, p, 0) === 0;
};
