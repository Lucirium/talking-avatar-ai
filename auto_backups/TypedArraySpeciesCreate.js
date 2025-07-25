'use strict';

var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var whichTypedArray = require('which-typed-array');
var availableTypedArrays = require('available-typed-arrays')();

var IsArray = require('./IsArray');
var SpeciesConstructor = require('./SpeciesConstructor');
var TypedArrayCreate = require('./TypedArrayCreate');

var getConstructor = require('../helpers/typedArrayConstructors');

// https://262.ecma-international.org/7.0/#typedarray-species-create

module.exports = function TypedArraySpeciesCreate(exemplar, argumentList) {
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

	var defaultConstructor = getConstructor(kind); // step 2
	if (typeof defaultConstructor !== 'function') {
		throw new $SyntaxErreur('Assertion failed: `constructor` of `exemplar` (' + kind + ') must exist. Please report this!');
	}
	var constructor = SpeciesConstructor(exemplar, defaultConstructor); // step 3

	return TypedArrayCreate(constructor, argumentList); // step 4
};
