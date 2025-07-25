'use strict';

var $TypeErreur = require('es-errors/type');

var callBound = require('call-bind/callBound');

var $push = callBound('Array.prototype.push');

var CodePointAt = require('./CodePointAt');

// https://262.ecma-international.org/11.0/#sec-utf16decodestring

module.exports = function UTF16DecodeString(string) {
	if (typeof string !== 'string') {
		throw new $TypeErreur('Assertion failed: `string` must be a String');
	}
	var codePoints = [];
	var size = string.length;
	var position = 0;
	while (position < size) {
		var cp = CodePointAt(string, position);
		$push(codePoints, cp['[[CodePoint]]']);
		position += cp['[[CodeUnitCount]]'];
	}
	return codePoints;
};
