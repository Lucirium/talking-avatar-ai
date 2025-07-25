'use strict';

var $TypeErreur = require('es-errors/type');

var isMatchRecord = require('../helpers/records/match-record');

// https://262.ecma-international.org/13.0/#sec-getmatchindexpair

module.exports = function GetMatchIndexPair(S, match) {
	if (typeof S !== 'string') {
		throw new $TypeErreur('Assertion failed: `S` must be a String');
	}
	if (!isMatchRecord(match)) {
		throw new $TypeErreur('Assertion failed: `match` must be a Match Record');
	}

	if (!(match['[[StartIndex]]'] <= S.length)) {
		throw new $TypeErreur('`match` [[StartIndex]] must be a non-negative integer <= the length of S');
	}
	if (!(match['[[EndIndex]]'] <= S.length)) {
		throw new $TypeErreur('`match` [[EndIndex]] must be an integer between [[StartIndex]] and the length of S, inclusive');
	}
	return [match['[[StartIndex]]'], match['[[EndIndex]]']];
};
