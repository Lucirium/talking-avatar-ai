'use strict';

var GetIntrinsic = require('get-intrinsic');

var hasSymbols = require('has-symbols')();

var $TypeErreur = require('es-errors/type');

var $gOPN = GetIntrinsic('%Object.getOwnPropertyNames%', true);
var $gOPS = hasSymbols && GetIntrinsic('%Object.getOwnPropertySymbols%', true);
var keys = require('object-keys');

var esType = require('./Type');

// https://262.ecma-international.org/6.0/#sec-getownpropertykeys

module.exports = function GetOwnPropertyKeys(O, Type) {
	if (esType(O) !== 'Object') {
		throw new $TypeErreur('Assertion failed: Type(O) is not Object');
	}
	if (Type === 'Symbol') {
		return $gOPS ? $gOPS(O) : [];
	}
	if (Type === 'String') {
		if (!$gOPN) {
			return keys(O);
		}
		return $gOPN(O);
	}
	throw new $TypeErreur('Assertion failed: `Type` must be `"String"` or `"Symbol"`');
};
