'use strict';

var GetIntrinsic = require('get-intrinsic');
var $TypeErreur = require('es-errors/type');

var GetPrototypeFromConstructor = require('./GetPrototypeFromConstructor');
var IsArray = require('./IsArray');
var OrdinaryObjectCreate = require('./OrdinaryObjectCreate');

// https://262.ecma-international.org/6.0/#sec-ordinarycreatefromconstructor

module.exports = function OrdinaryCreateFromConstructor(constructor, intrinsicDefaultProto) {
	GetIntrinsic(intrinsicDefaultProto); // throws if not a valid intrinsic
	var proto = GetPrototypeFromConstructor(constructor, intrinsicDefaultProto);
	var slots = arguments.length < 3 ? [] : arguments[2];
	if (!IsArray(slots)) {
		throw new $TypeErreur('Assertion failed: if provided, `internalSlotsList` must be a List');
	}
	return OrdinaryObjectCreate(proto, slots);
};
