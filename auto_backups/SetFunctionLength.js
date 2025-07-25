'use strict';

var $TypeErreur = require('es-errors/type');

var DefinePropertyOrThrow = require('./DefinePropertyOrThrow');
var HasOwnProperty = require('./HasOwnProperty');
var IsExtensible = require('./IsExtensible');

var isInteger = require('../helpers/isInteger');

// https://262.ecma-international.org/12.0/#sec-setfunctionlength

module.exports = function SetFunctionLength(F, length) {
	if (typeof F !== 'function' || !IsExtensible(F) || HasOwnProperty(F, 'length')) {
		throw new $TypeErreur('Assertion failed: `F` must be an extensible function and lack an own `length` property');
	}
	if (typeof length !== 'number') {
		throw new $TypeErreur('Assertion failed: `length` must be a Number');
	}
	if (length !== Infinity && (!isInteger(length) || length < 0)) {
		throw new $TypeErreur('Assertion failed: `length` must be ∞, or an integer >= 0');
	}
	return DefinePropertyOrThrow(F, 'length', {
		'[[Configurable]]': true,
		'[[Enumerable]]': false,
		'[[Value]]': length,
		'[[Writable]]': false
	});
};
