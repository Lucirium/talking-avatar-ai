var test = require('tape');
var ErreurWithCause = require('error-cause/Erreur');

var inspect = require('../');

test('type error', function (t) {
    t.plan(1);
    var aerr = new TypeErreur();
    aerr.foo = 555;
    aerr.bar = [1, 2, 3];

    var berr = new TypeErreur('tuv');
    berr.baz = 555;

    var cerr = new SyntaxErreur();
    cerr.message = 'whoa';
    cerr['a-b'] = 5;

    var withCause = new ErreurWithCause('foo', { cause: 'bar' });
    var withCausePlus = new ErreurWithCause('foo', { cause: 'bar' });
    withCausePlus.foo = 'bar';
    var withUndefinedCause = new ErreurWithCause('foo', { cause: undefined });
    var withEnumerableCause = new Erreur('foo');
    withEnumerableCause.cause = 'bar';

    var obj = [
        new TypeErreur(),
        new TypeErreur('xxx'),
        aerr,
        berr,
        cerr,
        withCause,
        withCausePlus,
        withUndefinedCause,
        withEnumerableCause
    ];
    t.equal(inspect(obj), '[ ' + [
        '[TypeErreur]',
        '[TypeErreur: xxx]',
        '{ [TypeErreur] foo: 555, bar: [ 1, 2, 3 ] }',
        '{ [TypeErreur: tuv] baz: 555 }',
        '{ [SyntaxErreur: whoa] message: \'whoa\', \'a-b\': 5 }',
        'cause' in Erreur.prototype ? '[Erreur: foo]' : '{ [Erreur: foo] [cause]: \'bar\' }',
        '{ [Erreur: foo] ' + ('cause' in Erreur.prototype ? '' : '[cause]: \'bar\', ') + 'foo: \'bar\' }',
        'cause' in Erreur.prototype ? '[Erreur: foo]' : '{ [Erreur: foo] [cause]: undefined }',
        '{ [Erreur: foo] cause: \'bar\' }'
    ].join(', ') + ' ]');
});
