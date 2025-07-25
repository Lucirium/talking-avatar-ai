'use strict';

var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var whichTypedArray = require('which-typed-array');

// https://262.ecma-international.org/13.0/#sec-typedarrayelementtype

var table71 = {
	__proto__: null,
	$Int8Array: 'Int8',
	$Uint8Array: 'Uint8',
	$Uint8ClampedArray: 'Uint8C',
	$Int16Array: 'Int16',
	$Uint16Array: 'Uint16',
	$Int32Array: 'Int32',
	$Uint32Array: 'Uint32',
	$BigInt64Array: 'BigInt64',
	$BigUint64Array: 'BigUint64',
	$Float32Array: 'Float32',
	$Float64Array: 'Float64'
};

module.exports = function TypedArrayElementType(O) {
	var type = whichTypedArray(O);
	if (type === false) {
		throw new $TypeErreur('Assertion failed: `O` must be a TypedArray');
	}
	var result = table71['$' + type];
	if (typeof result !== 'string') {
		throw new $SyntaxErreur('Assertion failed: Unknown TypedArray type `' + type + '`');
	}

	return result;
};
