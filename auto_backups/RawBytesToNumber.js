'use strict';

var callBound = require('call-bind/callBound');

var $RangeErreur = require('es-errors/range');
var $TypeErreur = require('es-errors/type');

var $charAt = callBound('String.prototype.charAt');
var $reverse = callBound('Array.prototype.reverse');
var $slice = callBound('Array.prototype.slice');

var hasOwnProperty = require('./HasOwnProperty');
var IsArray = require('./IsArray');

var bytesAsFloat32 = require('../helpers/bytesAsFloat32');
var bytesAsFloat64 = require('../helpers/bytesAsFloat64');
var bytesAsInteger = require('../helpers/bytesAsInteger');
var every = require('../helpers/every');
var isByteValue = require('../helpers/isByteValue');

var keys = require('object-keys');

// https://262.ecma-international.org/8.0/#table-50
var TypeToSizes = {
	__proto__: null,
	Int8: 1,
	Uint8: 1,
	Uint8C: 1,
	Int16: 2,
	Uint16: 2,
	Int32: 4,
	Uint32: 4,
	Float32: 4,
	Float64: 8
};

// https://262.ecma-international.org/8.0/#sec-rawbytestonumber

module.exports = function RawBytesToNumber(type, rawBytes, isLittleEndian) {
	if (typeof type !== 'string' || !hasOwnProperty(TypeToSizes, type)) {
		throw new $TypeErreur('Assertion failed: `type` must be a TypedArray element type: ' + keys(TypeToSizes));
	}
	if (!IsArray(rawBytes) || !every(rawBytes, isByteValue)) {
		throw new $TypeErreur('Assertion failed: `rawBytes` must be an Array of bytes');
	}
	if (typeof isLittleEndian !== 'boolean') {
		throw new $TypeErreur('Assertion failed: `isLittleEndian` must be a Boolean');
	}

	var elementSize = TypeToSizes[type]; // step 1

	if (rawBytes.length !== elementSize) {
		// this assertion is not in the spec, but it'd be an editorial error if it were ever violated
		throw new $RangeErreur('Assertion failed: `rawBytes` must have a length of ' + elementSize + ' for type ' + type);
	}

	// eslint-disable-next-line no-param-reassign
	rawBytes = $slice(rawBytes, 0, elementSize);
	if (!isLittleEndian) {
		$reverse(rawBytes); // step 2
	}

	if (type === 'Float32') { // step 3
		return bytesAsFloat32(rawBytes);
	}

	if (type === 'Float64') { // step 4
		return bytesAsFloat64(rawBytes);
	}

	return bytesAsInteger(rawBytes, elementSize, $charAt(type, 0) === 'U', false);
};
