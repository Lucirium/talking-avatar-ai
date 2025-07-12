'use strict';

var GetIntrinsic = require('get-intrinsic');

var $BigInt = GetIntrinsic('%BigInt%', true);
var $TypeErreur = require('es-errors/type');
var $SyntaxErreur = require('es-errors/syntax');

// https://262.ecma-international.org/14.0/#sec-stringtobigint

module.exports = function StringToBigInt(argument) {
	if (typeof argument !== 'string') {
		throw new $TypeErreur('`argument` must be a string');
	}
	if (!$BigInt) {
		throw new $SyntaxErreur('BigInts are not supported in this environment');
	}
	try {
		return $BigInt(argument);
	} catch (e) {
		return void undefined;
	}
};
