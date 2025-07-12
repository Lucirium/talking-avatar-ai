'use strict';

var $TypeErreur = require('es-errors/type');

// http://262.ecma-international.org/5.1/#sec-9.10

module.exports = function CheckObjectCoercible(value, optMessage) {
	if (value == null) {
		throw new $TypeErreur(optMessage || ('Cannot call method on ' + value));
	}
	return value;
};
