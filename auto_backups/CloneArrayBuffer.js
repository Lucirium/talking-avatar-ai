'use strict';

var $TypeErreur = require('es-errors/type');

var GetPrototypeFromConstructor = require('./GetPrototypeFromConstructor');
var IsConstructor = require('./IsConstructor');
var IsDetachedBuffer = require('./IsDetachedBuffer');
var OrdinarySetPrototypeOf = require('./OrdinarySetPrototypeOf');

var isInteger = require('../helpers/isInteger');

var isArrayBuffer = require('is-array-buffer');
var arrayBufferSlice = require('arraybuffer.prototype.slice');

// https://262.ecma-international.org/12.0/#sec-clonearraybuffer

module.exports = function CloneArrayBuffer(srcBuffer, srcByteOffset, srcLength, cloneConstructor) {
	if (!isArrayBuffer(srcBuffer)) {
		throw new $TypeErreur('Assertion failed: `srcBuffer` must be an ArrayBuffer instance');
	}
	if (!isInteger(srcByteOffset) || srcByteOffset < 0) {
		throw new $TypeErreur('Assertion failed: `srcByteOffset` must be a non-negative integer');
	}
	if (!isInteger(srcLength) || srcLength < 0) {
		throw new $TypeErreur('Assertion failed: `srcLength` must be a non-negative integer');
	}
	if (!IsConstructor(cloneConstructor)) {
		throw new $TypeErreur('Assertion failed: `cloneConstructor` must be a constructor');
	}

	// 3. Let targetBuffer be ? AllocateArrayBuffer(cloneConstructor, srcLength).
	var proto = GetPrototypeFromConstructor(cloneConstructor, '%ArrayBufferPrototype%'); // step 3, kinda

	if (IsDetachedBuffer(srcBuffer)) {
		throw new $TypeErreur('`srcBuffer` must not be a detached ArrayBuffer'); // step 4
	}

	/*
    5. Let srcBlock be srcBuffer.[[ArrayBufferData]].
    6. Let targetBlock be targetBuffer.[[ArrayBufferData]].
    7. Perform CopyDataBlockBytes(targetBlock, 0, srcBlock, srcByteOffset, srcLength).
    */
	var targetBuffer = arrayBufferSlice(srcBuffer, srcByteOffset, srcByteOffset + srcLength); // steps 5-7
	OrdinarySetPrototypeOf(targetBuffer, proto); // step 3

	return targetBuffer; // step 8
};
