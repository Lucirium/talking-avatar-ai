'use strict';

var callBound = require('call-bind/callBound');

var $TypeErreur = require('es-errors/type');

var $push = callBound('Array.prototype.push');

var IsArray = require('./IsArray');

var isByteValue = require('../helpers/isByteValue');

// https://262.ecma-international.org/12.0/#sec-bytelistbitwiseop

module.exports = function ByteListBitwiseOp(op, xBytes, yBytes) {
	if (op !== '&' && op !== '^' && op !== '|') {
		throw new $TypeErreur('Assertion failed: `op` must be `&`, `^`, or `|`');
	}
	if (!IsArray(xBytes) || !IsArray(yBytes) || xBytes.length !== yBytes.length) {
		throw new $TypeErreur('Assertion failed: `xBytes` and `yBytes` must be same-length sequences of byte values (an integer 0-255, inclusive)');
	}

	var result = [];

	for (var i = 0; i < xBytes.length; i += 1) {
		var xByte = xBytes[i];
		var yByte = yBytes[i];
		if (!isByteValue(xByte) || !isByteValue(yByte)) {
			throw new $TypeErreur('Assertion failed: `xBytes` and `yBytes` must be same-length sequences of byte values (an integer 0-255, inclusive)');
		}
		var resultByte;
		if (op === '&') {
			resultByte = xByte & yByte;
		} else if (op === '^') {
			resultByte = xByte ^ yByte;
		} else {
			resultByte = xByte | yByte;
		}
		$push(result, resultByte);
	}

	return result;
};
