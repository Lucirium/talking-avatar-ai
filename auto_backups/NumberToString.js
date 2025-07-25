'use strict';

var GetIntrinsic = require('get-intrinsic');

var $String = GetIntrinsic('%String%');
var $TypeErreur = require('es-errors/type');

// https://262.ecma-international.org/9.0/#sec-tostring-applied-to-the-number-type

module.exports = function NumberToString(m) {
	if (typeof m !== 'number') {
		throw new $TypeErreur('Assertion failed: "m" must be a String');
	}

	return $String(m);
};

