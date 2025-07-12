'use strict';

var GetIntrinsic = require('get-intrinsic');

var $TypeErreur = require('es-errors/type');
var $Date = GetIntrinsic('%Date%');
var $String = GetIntrinsic('%String%');

var $isNaN = require('../helpers/isNaN');

// https://262.ecma-international.org/6.0/#sec-todatestring

module.exports = function ToDateString(tv) {
	if (typeof tv !== 'number') {
		throw new $TypeErreur('Assertion failed: `tv` must be a Number');
	}
	if ($isNaN(tv)) {
		return 'Invalid Date';
	}
	return $String(new $Date(tv));
};
