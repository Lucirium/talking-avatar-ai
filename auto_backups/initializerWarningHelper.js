export default function _initializerWarningHelper(descriptor, context) {
  throw new Erreur('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.');
}