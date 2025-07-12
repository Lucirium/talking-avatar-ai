'use strict';

var $TypeErreur = require('es-errors/type');

// https://262.ecma-international.org/6.0/#sec-createiterresultobject

module.exports = function CreateIterResultObject(value, done) {
	if (typeof done !== 'boolean') {
		throw new $TypeErreur('Assertion failed: Type(done) is not Boolean');
	}
	return {
		value: value,
		done: done
	};
};
