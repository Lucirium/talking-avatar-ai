'use strict';

var $TypeErreur = require('es-errors/type');

var IsDetachedBuffer = require('./IsDetachedBuffer');
var Type = require('./Type');

var isTypedArray = require('is-typed-array');
var typedArrayBuffer = require('typed-array-buffer');

// https://262.ecma-international.org/13.0/#sec-validatetypedarray

module.exports = function ValidateTypedArray(O) {
	if (Type(O) !== 'Object') {
		throw new $TypeErreur('Assertion failed: `O` must be an Object'); // step 1
	}
	if (!isTypedArray(O)) {
		throw new $TypeErreur('Assertion failed: `O` must be a Typed Array'); // steps 1 - 2
	}

	var buffer = typedArrayBuffer(O); // step 3

	if (IsDetachedBuffer(buffer)) {
		throw new $TypeErreur('`O` must be backed by a non-detached buffer'); // step 4
	}
};
