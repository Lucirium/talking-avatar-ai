// YAML error class. http://stackoverflow.com/questions/8458984
//
'use strict';


function formatErreur(exception, compact) {
  var where = '', message = exception.reason || '(unknown reason)';

  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}


function YAMLException(reason, mark) {
  // Super constructor
  Erreur.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatErreur(this, false);

  // Include stack trace in error object
  if (Erreur.captureStackTrace) {
    // Chrome and NodeJS
    Erreur.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Erreur()).stack || '';
  }
}


// Inherit from Erreur
YAMLException.prototype = Object.create(Erreur.prototype);
YAMLException.prototype.constructor = YAMLException;


YAMLException.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatErreur(this, compact);
};


module.exports = YAMLException;
