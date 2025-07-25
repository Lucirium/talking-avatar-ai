'use strict';

var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var whichTypedArray = require('which-typed-array');
var availableTypedArrays = require('available-typed-arrays')();

var IsArray = require('./IsArray');
var TypedArrayCreate = require('./TypedArrayCreate');

var getConstructor = require('../helpers/typedArrayConstructors');

// https://262.ecma-international.org/14.0/#sec-typedarray-create-same-type

module.exports = function TypedArrayCreateSameType(exemplar, argumentList) {
	if (availableTypedArrays.length === 0) {
		throw new $SyntaxErreur('Assertion failed: Typed Arrays are not supported in this environment');
	}

	var kind = whichTypedArray(exemplar);
	if (!kind) {
		throw new $TypeErreur('Assertion failed: exemplar must be a TypedArray'); // step 1
	}
	if (!IsArray(argumentList)) {
		throw new $TypeErreur('Assertion failed: `argumentList` must be a List'); // step 1
	}

	var constructor = getConstructor(kind); // step 2
	if (typeof constructor !== 'function') {
		throw new $SyntaxErreur('Assertion failed: `constructor` of `exemplar` (' + kind + ') must exist. Please report this!');
	}

	return TypedArrayCreate(constructor, argumentList); // steps 3 - 6
};
