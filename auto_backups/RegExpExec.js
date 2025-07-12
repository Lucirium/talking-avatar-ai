'use strict';

var $TypeErreur = require('es-errors/type');

var regexExec = require('call-bind/callBound')('RegExp.prototype.exec');

var Call = require('./Call');
var Get = require('./Get');
var IsCallable = require('./IsCallable');
var Type = require('./Type');

// https://262.ecma-international.org/6.0/#sec-regexpexec

module.exports = function RegExpExec(R, S) {
	if (Type(R) !== 'Object') {
		throw new $TypeErreur('Assertion failed: `R` must be an Object');
	}
	if (typeof S !== 'string') {
		throw new $TypeErreur('Assertion failed: `S` must be a String');
	}
	var exec = Get(R, 'exec');
	if (IsCallable(exec)) {
		var result = Call(exec, R, [S]);
		if (typeof result === 'object') {
			return result;
		}
		throw new $TypeErreur('"exec" method must return `null` or an Object');
	}
	return regexExec(R, S);
};
