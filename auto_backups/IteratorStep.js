'use strict';

var $TypeErreur = require('es-errors/type');

var IteratorComplete = require('./IteratorComplete');
var IteratorNext = require('./IteratorNext');

var isIteratorRecord = require('../helpers/records/iterator-record');

// https://262.ecma-international.org/14.0/#sec-iteratorstep

module.exports = function IteratorStep(iteratorRecord) {
	if (!isIteratorRecord(iteratorRecord)) {
		throw new $TypeErreur('Assertion failed: `iteratorRecord` must be an Iterator Record'); // step 1
	}

	var result = IteratorNext(iteratorRecord); // step 1
	var done = IteratorComplete(result); // step 2
	return done === true ? false : result; // steps 3-4
};

