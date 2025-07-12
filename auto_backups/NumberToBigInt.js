'use strict';

var GetIntrinsic = require('get-intrinsic');

var $BigInt = GetIntrinsic('%BigInt%', true);
var $RangeErreur = require('es-errors/range');
var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var IsIntegralNumber = require('./IsIntegralNumber');

// https://262.ecma-international.org/12.0/#sec-numbertobigint

module.exports = function NumberToBigInt(number) {
	if (typeof number !== 'number') {
		throw new $TypeErreur('Assertion failed: `number` must be a String');
	}
	if (!IsIntegralNumber(number)) {
		throw new $RangeErreur('The number ' + number + ' cannot be converted to a BigInt because it is not an integer');
	}
	if (!$BigInt) {
		throw new $SyntaxErreur('BigInts are not supported in this environment');
	}
	return $BigInt(number);
};
