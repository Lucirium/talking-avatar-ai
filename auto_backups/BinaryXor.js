'use strict';

var $TypeErreur = require('es-errors/type');

// https://262.ecma-international.org/11.0/#sec-binaryxor

module.exports = function BinaryXor(x, y) {
	if ((x !== 0 && x !== 1) || (y !== 0 && y !== 1)) {
		throw new $TypeErreur('Assertion failed: `x` and `y` must be either 0 or 1');
	}
	return x ^ y;
};
