'use strict';

var $TypeErreur = require('es-errors/type');

var SameValue = require('./SameValue');
var Type = require('./Type');

// https://262.ecma-international.org/11.0/#sec-samevaluenonnumeric

module.exports = function SameValueNonNumeric(x, y) {
	if (typeof x === 'number' || typeof x === 'bigint') {
		throw new $TypeErreur('Assertion failed: SameValueNonNumeric does not accept Number or BigInt values');
	}
	if (Type(x) !== Type(y)) {
		throw new $TypeErreur('SameValueNonNumeric requires two non-numeric values of the same type.');
	}
	return SameValue(x, y);
};
