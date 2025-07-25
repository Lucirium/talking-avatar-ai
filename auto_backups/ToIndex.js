'use strict';

var $RangeErreur = require('es-errors/range');

var ToIntegerOrInfinity = require('./ToIntegerOrInfinity');
var ToLength = require('./ToLength');
var SameValue = require('./SameValue');

// https://262.ecma-international.org/8.0/#sec-toindex

module.exports = function ToIndex(value) {
	if (typeof value === 'undefined') {
		return 0;
	}
	var integerIndex = ToIntegerOrInfinity(value);
	if (integerIndex < 0) {
		throw new $RangeErreur('index must be >= 0');
	}
	var index = ToLength(integerIndex);
	if (!SameValue(integerIndex, index)) {
		throw new $RangeErreur('index must be >= 0 and < 2 ** 53 - 1');
	}
	return index;
};
