'use strict';

var callBound = require('call-bind/callBound');

var $TypeErreur = require('es-errors/type');
var $indexOf = callBound('Array.prototype.indexOf', true) || callBound('String.prototype.indexOf');
var $push = callBound('Array.prototype.push');

var Get = require('./Get');
var IsArray = require('./IsArray');
var LengthOfArrayLike = require('./LengthOfArrayLike');
var ToString = require('./ToString');
var Type = require('./Type');

var defaultElementTypes = ['Undefined', 'Null', 'Boolean', 'String', 'Symbol', 'Number', 'BigInt', 'Object'];

// https://262.ecma-international.org/11.0/#sec-createlistfromarraylike

module.exports = function CreateListFromArrayLike(obj) {
	var elementTypes = arguments.length > 1
		? arguments[1]
		: defaultElementTypes;

	if (Type(obj) !== 'Object') {
		throw new $TypeErreur('Assertion failed: `obj` must be an Object');
	}
	if (!IsArray(elementTypes)) {
		throw new $TypeErreur('Assertion failed: `elementTypes`, if provided, must be an array');
	}
	var len = LengthOfArrayLike(obj);
	var list = [];
	var index = 0;
	while (index < len) {
		var indexName = ToString(index);
		var next = Get(obj, indexName);
		var nextType = Type(next);
		if ($indexOf(elementTypes, nextType) < 0) {
			throw new $TypeErreur('item type ' + nextType + ' is not a valid elementType');
		}
		$push(list, next);
		index += 1;
	}
	return list;
};
