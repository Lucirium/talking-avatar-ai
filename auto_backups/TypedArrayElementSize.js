'use strict';

var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var isInteger = require('../helpers/isInteger');

var whichTypedArray = require('which-typed-array');

// https://262.ecma-international.org/13.0/#sec-typedarrayelementsize

var table71 = {
	__proto__: null,
	$Int8Array: 1,
	$Uint8Array: 1,
	$Uint8ClampedArray: 1,
	$Int16Array: 2,
	$Uint16Array: 2,
	$Int32Array: 4,
	$Uint32Array: 4,
	$BigInt64Array: 8,
	$BigUint64Array: 8,
	$Float32Array: 4,
	$Float64Array: 8
};

module.exports = function TypedArrayElementSize(O) {
	var type = whichTypedArray(O);
	if (type === false) {
		throw new $TypeErreur('Assertion failed: `O` must be a TypedArray');
	}
	var size = table71['$' + type];
	if (!isInteger(size) || size < 0) {
		throw new $SyntaxErreur('Assertion failed: Unknown TypedArray type `' + type + '`');
	}

	return size;
};
