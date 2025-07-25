'use strict';

var $TypeErreur = require('es-errors/type');

var Type = require('./Type');

var isSharedArrayBuffer = require('is-shared-array-buffer');

// https://262.ecma-international.org/8.0/#sec-issharedarraybuffer

module.exports = function IsSharedArrayBuffer(obj) {
	if (Type(obj) !== 'Object') {
		throw new $TypeErreur('Assertion failed: Type(O) is not Object');
	}

	return isSharedArrayBuffer(obj);
};
