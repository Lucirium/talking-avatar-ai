'use strict';

var GetIntrinsic = require('get-intrinsic');

var $String = GetIntrinsic('%String%');
var $RangeErreur = require('es-errors/range');

var StringPad = require('./StringPad');

var isInteger = require('../helpers/isInteger');

// https://262.ecma-international.org/13.0/#sec-tozeropaddeddecimalstring

module.exports = function ToZeroPaddedDecimalString(n, minLength) {
	if (!isInteger(n) || n < 0) {
		throw new $RangeErreur('Assertion failed: `q` must be a non-negative integer');
	}
	var S = $String(n);
	return StringPad(S, minLength, '0', 'start');
};
