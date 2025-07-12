'use strict';

var $TypeErreur = require('es-errors/type');

var SameValue = require('./SameValue');
var Type = require('./Type');

// https://262.ecma-international.org/14.0/#sec-samevaluenonnumeric

module.exports = function SameValueNonNumber(x, y) {
	var xType = Type(x);
	if (xType === 'Number') {
		throw new $TypeErreur('Assertion failed: SameValueNonNumber does not accept Number values');
	}
	if (xType !== Type(y)) {
		throw new $TypeErreur('SameValueNonNumber requires two non-Number values of the same type.');
	}
	return SameValue(x, y);
};
