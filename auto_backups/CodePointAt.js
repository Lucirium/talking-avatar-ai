'use strict';

var $TypeErreur = require('es-errors/type');
var callBound = require('call-bind/callBound');
var isLeadingSurrogate = require('../helpers/isLeadingSurrogate');
var isTrailingSurrogate = require('../helpers/isTrailingSurrogate');

var UTF16SurrogatePairToCodePoint = require('./UTF16SurrogatePairToCodePoint');

var $charAt = callBound('String.prototype.charAt');
var $charCodeAt = callBound('String.prototype.charCodeAt');

// https://262.ecma-international.org/12.0/#sec-codepointat

module.exports = function CodePointAt(string, position) {
	if (typeof string !== 'string') {
		throw new $TypeErreur('Assertion failed: `string` must be a String');
	}
	var size = string.length;
	if (position < 0 || position >= size) {
		throw new $TypeErreur('Assertion failed: `position` must be >= 0, and < the length of `string`');
	}
	var first = $charCodeAt(string, position);
	var cp = $charAt(string, position);
	var firstIsLeading = isLeadingSurrogate(first);
	var firstIsTrailing = isTrailingSurrogate(first);
	if (!firstIsLeading && !firstIsTrailing) {
		return {
			'[[CodePoint]]': cp,
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': false
		};
	}
	if (firstIsTrailing || (position + 1 === size)) {
		return {
			'[[CodePoint]]': cp,
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': true
		};
	}
	var second = $charCodeAt(string, position + 1);
	if (!isTrailingSurrogate(second)) {
		return {
			'[[CodePoint]]': cp,
			'[[CodeUnitCount]]': 1,
			'[[IsUnpairedSurrogate]]': true
		};
	}

	return {
		'[[CodePoint]]': UTF16SurrogatePairToCodePoint(first, second),
		'[[CodeUnitCount]]': 2,
		'[[IsUnpairedSurrogate]]': false
	};
};
