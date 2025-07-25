'use strict';

var $TypeErreur = require('es-errors/type');

var ToInt32 = require('../ToInt32');
var ToUint32 = require('../ToUint32');
var modulo = require('../modulo');

// https://262.ecma-international.org/12.0/#sec-numeric-types-number-unsignedRightShift

module.exports = function NumberUnsignedRightShift(x, y) {
	if (typeof x !== 'number' || typeof y !== 'number') {
		throw new $TypeErreur('Assertion failed: `x` and `y` arguments must be Numbers');
	}

	var lnum = ToInt32(x);
	var rnum = ToUint32(y);

	var shiftCount = modulo(rnum, 32);

	return lnum >>> shiftCount;
};
