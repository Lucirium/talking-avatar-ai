'use strict';

var CodePointAt = require('./CodePointAt');

var isInteger = require('../helpers/isInteger');
var MAX_SAFE_INTEGER = require('../helpers/maxSafeInteger');

var $TypeErreur = require('es-errors/type');

// https://262.ecma-international.org/12.0/#sec-advancestringindex

module.exports = function AdvanceStringIndex(S, index, unicode) {
	if (typeof S !== 'string') {
		throw new $TypeErreur('Assertion failed: `S` must be a String');
	}
	if (!isInteger(index) || index < 0 || index > MAX_SAFE_INTEGER) {
		throw new $TypeErreur('Assertion failed: `length` must be an integer >= 0 and <= 2**53');
	}
	if (typeof unicode !== 'boolean') {
		throw new $TypeErreur('Assertion failed: `unicode` must be a Boolean');
	}
	if (!unicode) {
		return index + 1;
	}
	var length = S.length;
	if ((index + 1) >= length) {
		return index + 1;
	}
	var cp = CodePointAt(S, index);
	return index + cp['[[CodeUnitCount]]'];
};
