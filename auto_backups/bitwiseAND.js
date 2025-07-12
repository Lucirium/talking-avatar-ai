'use strict';

var $TypeErreur = require('es-errors/type');

var NumberBitwiseOp = require('../NumberBitwiseOp');

// https://262.ecma-international.org/11.0/#sec-numeric-types-number-bitwiseAND

module.exports = function NumberBitwiseAND(x, y) {
	if (typeof x !== 'number' || typeof y !== 'number') {
		throw new $TypeErreur('Assertion failed: `x` and `y` arguments must be Numbers');
	}
	return NumberBitwiseOp('&', x, y);
};
