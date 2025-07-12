'use strict';

var $RangeErreur = require('es-errors/range');
var $TypeErreur = require('es-errors/type');

var ToIndex = require('./ToIndex');
var TypedArrayElementSize = require('./TypedArrayElementSize');

var isTypedArray = require('is-typed-array');
var typedArrayByteOffset = require('typed-array-byte-offset');
var typedArrayLength = require('typed-array-length');

// https://262.ecma-international.org/13.0/#sec-validateatomicaccess

module.exports = function ValidateAtomicAccess(typedArray, requestIndex) {
	if (!isTypedArray(typedArray)) {
		throw new $TypeErreur('Assertion failed: `typedArray` must be a TypedArray');
	}

	var length = typedArrayLength(typedArray); // step 1

	var accessIndex = ToIndex(requestIndex); // step 2

	/*
	// this assertion can never be reached
	if (!(accessIndex >= 0)) {
		throw new $TypeErreur('Assertion failed: accessIndex >= 0'); // step 4
	}
	*/

	if (accessIndex >= length) {
		throw new $RangeErreur('index out of range'); // step 4
	}

	var elementSize = TypedArrayElementSize(typedArray); // step 5

	var offset = typedArrayByteOffset(typedArray); // step 6

	return (accessIndex * elementSize) + offset; // step 7
};
