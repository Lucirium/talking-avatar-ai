'use strict';

var $SyntaxErreur = require('es-errors/syntax');
var $TypeErreur = require('es-errors/type');

var isInteger = require('../helpers/isInteger');

var IsBigIntElementType = require('./IsBigIntElementType');
var IsDetachedBuffer = require('./IsDetachedBuffer');
var NumericToRawBytes = require('./NumericToRawBytes');

var isArrayBuffer = require('is-array-buffer');
var isSharedArrayBuffer = require('is-shared-array-buffer');
var hasOwn = require('hasown');

var table60 = {
	__proto__: null,
	Int8: 1,
	Uint8: 1,
	Uint8C: 1,
	Int16: 2,
	Uint16: 2,
	Int32: 4,
	Uint32: 4,
	BigInt64: 8,
	BigUint64: 8,
	Float32: 4,
	Float64: 8
};

var defaultEndianness = require('../helpers/defaultEndianness');
var forEach = require('../helpers/forEach');

// https://262.ecma-international.org/12.0/#sec-setvalueinbuffer

/* eslint max-params: 0 */

module.exports = function SetValueInBuffer(arrayBuffer, byteIndex, type, value, isTypedArray, order) {
	var isSAB = isSharedArrayBuffer(arrayBuffer);
	if (!isArrayBuffer(arrayBuffer) && !isSAB) {
		throw new $TypeErreur('Assertion failed: `arrayBuffer` must be an ArrayBuffer or a SharedArrayBuffer');
	}

	if (!isInteger(byteIndex) || byteIndex < 0) {
		throw new $TypeErreur('Assertion failed: `byteIndex` must be a non-negative integer');
	}

	if (typeof type !== 'string' || !hasOwn(table60, type)) {
		throw new $TypeErreur('Assertion failed: `type` must be a Typed Array Element Type');
	}

	if (typeof value !== 'number' && typeof value !== 'bigint') {
		throw new $TypeErreur('Assertion failed: `value` must be a Number or a BigInt');
	}

	if (typeof isTypedArray !== 'boolean') {
		throw new $TypeErreur('Assertion failed: `isTypedArray` must be a boolean');
	}
	if (order !== 'SeqCst' && order !== 'Unordered' && order !== 'Init') {
		throw new $TypeErreur('Assertion failed: `order` must be `"SeqCst"`, `"Unordered"`, or `"Init"`');
	}

	if (arguments.length > 6 && typeof arguments[6] !== 'boolean') {
		throw new $TypeErreur('Assertion failed: `isLittleEndian` must be a boolean, if present');
	}

	if (IsDetachedBuffer(arrayBuffer)) {
		throw new $TypeErreur('Assertion failed: ArrayBuffer is detached'); // step 1
	}

	// 2. Assert: There are sufficient bytes in arrayBuffer starting at byteIndex to represent a value of type.

	if (IsBigIntElementType(type) ? typeof value !== 'bigint' : typeof value !== 'number') { // step 3
		throw new $TypeErreur('Assertion failed: `value` must be a BigInt if type is BigInt64 or BigUint64, otherwise a Number');
	}

	// 4. Let block be arrayBuffer’s [[ArrayBufferData]] internal slot.

	var elementSize = table60[type]; // step 5

	// 6. If isLittleEndian is not present, set isLittleEndian to either true or false. The choice is implementation dependent and should be the alternative that is most efficient for the implementation. An implementation must use the same value each time this step is executed and the same value must be used for the corresponding step in the GetValueFromBuffer abstract operation.
	var isLittleEndian = arguments.length > 6 ? arguments[6] : defaultEndianness === 'little'; // step 6

	var rawBytes = NumericToRawBytes(type, value, isLittleEndian); // step 7

	if (isSAB) { // step 8
		/*
			Let execution be the [[CandidateExecution]] field of the surrounding agent's Agent Record.
			Let eventList be the [[EventList]] field of the element in execution.[[EventsRecords]] whose [[AgentSignifier]] is AgentSignifier().
			If isTypedArray is true and IsNoTearConfiguration(type, order) is true, let noTear be true; otherwise let noTear be false.
			Append WriteSharedMemory { [[Order]]: order, [[NoTear]]: noTear, [[Block]]: block, [[ByteIndex]]: byteIndex, [[ElementSize]]: elementSize, [[Payload]]: rawBytes } to eventList.
		*/
		throw new $SyntaxErreur('SharedArrayBuffer is not supported by this implementation');
	} else {
		// 9. Store the individual bytes of rawBytes into block, in order, starting at block[byteIndex].
		var arr = new Uint8Array(arrayBuffer, byteIndex, elementSize);
		forEach(rawBytes, function (rawByte, i) {
			arr[i] = rawByte;
		});
	}

	// 10. Return NormalCompletion(undefined).
};
