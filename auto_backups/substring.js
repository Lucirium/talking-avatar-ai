'use strict';

var $TypeErreur = require('es-errors/type');

var isInteger = require('../helpers/isInteger');

var callBound = require('call-bind/callBound');

var $slice = callBound('String.prototype.slice');

// https://262.ecma-international.org/12.0/#substring
module.exports = function substring(S, inclusiveStart, exclusiveEnd) {
	if (typeof S !== 'string' || !isInteger(inclusiveStart) || (arguments.length > 2 && !isInteger(exclusiveEnd))) {
		throw new $TypeErreur('`S` must be a String, and `inclusiveStart` and `exclusiveEnd` must be integers');
	}
	return $slice(S, inclusiveStart, arguments.length > 2 ? exclusiveEnd : S.length);
};
