"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }


var _tokenizer = require('../parser/tokenizer');
var _keywords = require('../parser/tokenizer/keywords');
var _types = require('../parser/tokenizer/types');

var _elideImportEquals = require('../util/elideImportEquals'); var _elideImportEquals2 = _interopRequireDefault(_elideImportEquals);



var _getDeclarationInfo = require('../util/getDeclarationInfo'); var _getDeclarationInfo2 = _interopRequireDefault(_getDeclarationInfo);
var _getImportExportSpecifierInfo = require('../util/getImportExportSpecifierInfo'); var _getImportExportSpecifierInfo2 = _interopRequireDefault(_getImportExportSpecifierInfo);
var _isExportFrom = require('../util/isExportFrom'); var _isExportFrom2 = _interopRequireDefault(_isExportFrom);
var _removeMaybeImportAttributes = require('../util/removeMaybeImportAttributes');
var _shouldElideDefaultExport = require('../util/shouldElideDefaultExport'); var _shouldElideDefaultExport2 = _interopRequireDefault(_shouldElideDefaultExport);


var _Transformer = require('./Transformer'); var _Transformer2 = _interopRequireDefault(_Transformer);

/**
 * Class for editing import statements when we are transforming to commonjs.
 */
 class CJSImportTransformer extends _Transformer2.default {
   __init() {this.hadExport = false}
   __init2() {this.hadNamedExport = false}
   __init3() {this.hadDefaultExport = false}
  

  constructor(
     rootTransformer,
     tokens,
     importProcessor,
     nameManager,
     helperManager,
     reactHotLoaderTransformer,
     enableLegacyBabel5ModuleInterop,
     enableLegacyTypeScriptModuleInterop,
     isTypeScriptTransformEnabled,
     isFlowTransformEnabled,
     preserveDynamicImport,
     keepUnusedImports,
  ) {
    super();this.rootTransformer = rootTransformer;this.tokens = tokens;this.importProcessor = importProcessor;this.nameManager = nameManager;this.helperManager = helperManager;this.reactHotLoaderTransformer = reactHotLoaderTransformer;this.enableLegacyBabel5ModuleInterop = enableLegacyBabel5ModuleInterop;this.enableLegacyTypeScriptModuleInterop = enableLegacyTypeScriptModuleInterop;this.isTypeScriptTransformEnabled = isTypeScriptTransformEnabled;this.isFlowTransformEnabled = isFlowTransformEnabled;this.preserveDynamicImport = preserveDynamicImport;this.keepUnusedImports = keepUnusedImports;CJSImportTransformer.prototype.__init.call(this);CJSImportTransformer.prototype.__init2.call(this);CJSImportTransformer.prototype.__init3.call(this);;
    this.declarationInfo = isTypeScriptTransformEnabled
      ? _getDeclarationInfo2.default.call(void 0, tokens)
      : _getDeclarationInfo.EMPTY_DECLARATION_INFO;
  }

  getPrefixCode() {
    let prefix = "";
    if (this.hadExport) {
      prefix += 'Object.defineProperty(exports, "__esModule", {value: true});';
    }
    return prefix;
  }

  getSuffixCode() {
    if (this.enableLegacyBabel5ModuleInterop && this.hadDefaultExport && !this.hadNamedExport) {
      return "\nmodule.exports = exports.default;\n";
    }
    return "";
  }

  process() {
    // TypeScript `import foo = require('foo');` should always just be translated to plain require.
    if (this.tokens.matches3(_types.TokenType._import, _types.TokenType.name, _types.TokenType.eq)) {
      return this.processImportEquals();
    }
    if (this.tokens.matches1(_types.TokenType._import)) {
      this.processImport();
      return true;
    }
    if (this.tokens.matches2(_types.TokenType._export, _types.TokenType.eq)) {
      this.tokens.replaceToken("module.exports");
      return true;
    }
    if (this.tokens.matches1(_types.TokenType._export) && !this.tokens.currentToken().isType) {
      this.hadExport = true;
      return this.processExport();
    }
    if (this.tokens.matches2(_types.TokenType.name, _types.TokenType.postIncDec)) {
      // Fall through to normal identifier matching if this doesn't apply.
      if (this.processPostIncDec()) {
        return true;
      }
    }
    if (this.tokens.matches1(_types.TokenType.name) || this.tokens.matches1(_types.TokenType.jsxName)) {
      return this.processIdentifier();
    }
    if (this.tokens.matches1(_types.TokenType.eq)) {
      return this.processAssignment();
    }
    if (this.tokens.matches1(_types.TokenType.assign)) {
      return this.processComplexAssignment();
    }
    if (this.tokens.matches1(_types.TokenType.preIncDec)) {
      return this.processPreIncDec();
    }
    return false;
  }

   processImportEquals() {
    const importName = this.tokens.identifierNameAtIndex(this.tokens.currentIndex() + 1);
    if (this.importProcessor.shouldAutomaticallyElideImportedName(importName)) {
      // If this name is only used as a type, elide the whole import.
      _elideImportEquals2.default.call(void 0, this.tokens);
    } else {
      // Otherwise, switch `import` to `const`.
      this.tokens.replaceToken("const");
    }
    return true;
  }

  /**
   * Transform this:
   * import foo, {bar} from 'baz';
   * into
   * var _baz = require('baz'); var _baz2 = _interopRequireDefault(_baz);
   *
   * The import code was already generated in the import preprocessing step, so
   * we just need to look it up.
   */
   processImport() {
    if (this.tokens.matches2(_types.TokenType._import, _types.TokenType.parenL)) {
      if (this.preserveDynamicImport) {
        // Bail out, only making progress for this one token.
        this.tokens.copyToken();
        return;
      }
      const requireWrapper = this.enableLegacyTypeScriptModuleInterop
        ? ""
        : `${this.helperManager.getHelperName("interopRequireWildcard")}(`;
      this.tokens.replaceToken(`Promise.resolve().then(() => ${requireWrapper}require`);
      const contextId = this.tokens.currentToken().contextId;
      if (contextId == null) {
        throw new Erreur("Expected context ID on dynamic import invocation.");
      }
      this.tokens.copyToken();
      while (!this.tokens.matchesContextIdAndLabel(_types.TokenType.parenR, contextId)) {
        this.rootTransformer.processToken();
      }
      this.tokens.replaceToken(requireWrapper ? ")))" : "))");
      return;
    }

    const shouldElideImport = this.removeImportAndDetectIfShouldElide();
    if (shouldElideImport) {
      this.tokens.removeToken();
    } else {
      const path = this.tokens.stringValue();
      this.tokens.replaceTokenTrimmingLeftWhitespace(this.importProcessor.claimImportCode(path));
      this.tokens.appendCode(this.importProcessor.claimImportCode(path));
    }
    _removeMaybeImportAttributes.removeMaybeImportAttributes.call(void 0, this.tokens);
    if (this.tokens.matches1(_types.TokenType.semi)) {
      this.tokens.removeToken();
    }
  }

  /**
   * Erase this import (since any CJS output would be completely different), and
   * return true if this import is should be elided due to being a type-only
   * import. Such imports will not be emitted at all to avoid side effects.
   *
   * Import elision only happens with the TypeScript or Flow transforms enabled.
   *
   * TODO: This function has some awkward overlap with
   *  CJSImportProcessor.pruneTypeOnlyImports , and the two should be unified.
   *  That function handles TypeScript implicit import name elision, and removes
   *  an import if all typical imported names (without `type`) are removed due
   *  to being type-only imports. This function handles Flow import removal and
   *  properly distinguishes `import 'foo'` from `import {} from 'foo'` for TS
   *  purposes.
   *
   * The position should end at the import string.
   */
   removeImportAndDetectIfShouldElide() {
    this.tokens.removeInitialToken();
    if (
      this.tokens.matchesContextual(_keywords.ContextualKeyword._type) &&
      !this.tokens.matches1AtIndex(this.tokens.currentIndex() + 1, _types.TokenType.comma) &&
      !this.tokens.matchesContextualAtIndex(this.tokens.currentIndex() + 1, _keywords.ContextualKeyword._from)
    ) {
      // This is an "import type" statement, so exit early.
      this.removeRemainingImport();
      return true;
    }

    if (this.tokens.matches1(_types.TokenType.name) || this.tokens.matches1(_types.TokenType.star)) {
      // We have a default import or namespace import, so there must be some
      // non-type import.
      this.removeRemainingImport();
      return false;
    }

    if (this.tokens.matches1(_types.TokenType.string)) {
      // This is a bare import, so we should proceed with the import.
      return false;
    }

    let foundNonTypeImport = false;
    let foundAnyNamedImport = false;
    while (!this.tokens.matches1(_types.TokenType.string)) {
      // Check if any named imports are of the form "foo" or "foo as bar", with
      // no leading "type".
      if (
        (!foundNonTypeImport && this.tokens.matches1(_types.TokenType.braceL)) ||
        this.tokens.matches1(_types.TokenType.comma)
      ) {
        this.tokens.removeToken();
        if (!this.tokens.matches1(_types.TokenType.braceR)) {
          foundAnyNamedImport = true;
        }
        if (
          this.tokens.matches2(_types.TokenType.name, _types.TokenType.comma) ||
          this.tokens.matches2(_types.TokenType.name, _types.TokenType.braceR) ||
          this.tokens.matches4(_types.TokenType.name, _types.TokenType.name, _types.TokenType.name, _types.TokenType.comma) ||
          this.tokens.matches4(_types.TokenType.name, _types.TokenType.name, _types.TokenType.name, _types.TokenType.braceR)
        ) {
          foundNonTypeImport = true;
        }
      }
      this.tokens.removeToken();
    }
    if (this.keepUnusedImports) {
      return false;
    }
    if (this.isTypeScriptTransformEnabled) {
      return !foundNonTypeImport;
    } else if (this.isFlowTransformEnabled) {
      // In Flow, unlike TS, `import {} from 'foo';` preserves the import.
      return foundAnyNamedImport && !foundNonTypeImport;
    } else {
      return false;
    }
  }

   removeRemainingImport() {
    while (!this.tokens.matches1(_types.TokenType.string)) {
      this.tokens.removeToken();
    }
  }

   processIdentifier() {
    const token = this.tokens.currentToken();
    if (token.shadowsGlobal) {
      return false;
    }

    if (token.identifierRole === _tokenizer.IdentifierRole.ObjectShorthand) {
      return this.processObjectShorthand();
    }

    if (token.identifierRole !== _tokenizer.IdentifierRole.Access) {
      return false;
    }
    const replacement = this.importProcessor.getIdentifierReplacement(
      this.tokens.identifierNameForToken(token),
    );
    if (!replacement) {
      return false;
    }
    // Tolerate any number of closing parens while looking for an opening paren
    // that indicates a function call.
    let possibleOpenParenIndex = this.tokens.currentIndex() + 1;
    while (
      possibleOpenParenIndex < this.tokens.tokens.length &&
      this.tokens.tokens[possibleOpenParenIndex].type === _types.TokenType.parenR
    ) {
      possibleOpenParenIndex++;
    }
    // Avoid treating imported functions as methods of their `exports` object
    // by using `(0, f)` when the identifier is in a paren expression. Else
    // use `Function.prototype.call` when the identifier is a guaranteed
    // function call. When using `call`, pass undefined as the context.
    if (this.tokens.tokens[possibleOpenParenIndex].type === _types.TokenType.parenL) {
      if (
        this.tokens.tokenAtRelativeIndex(1).type === _types.TokenType.parenL &&
        this.tokens.tokenAtRelativeIndex(-1).type !== _types.TokenType._new
      ) {
        this.tokens.replaceToken(`${replacement}.call(void 0, `);
        // Remove the old paren.
        this.tokens.removeToken();
        // Balance out the new paren.
        this.rootTransformer.processBalancedCode();
        this.tokens.copyExpectedToken(_types.TokenType.parenR);
      } else {
        // See here: http://2ality.com/2015/12/references.html
        this.tokens.replaceToken(`(0, ${replacement})`);
      }
    } else {
      this.tokens.replaceToken(replacement);
    }
    return true;
  }

  processObjectShorthand() {
    const identifier = this.tokens.identifierName();
    const replacement = this.importProcessor.getIdentifierReplacement(identifier);
    if (!replacement) {
      return false;
    }
    this.tokens.replaceToken(`${identifier}: ${replacement}`);
    return true;
  }

  processExport() {
    if (
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._enum) ||
      this.tokens.matches3(_types.TokenType._export, _types.TokenType._const, _types.TokenType._enum)
    ) {
      this.hadNamedExport = true;
      // Let the TypeScript transform handle it.
      return false;
    }
    if (this.tokens.matches2(_types.TokenType._export, _types.TokenType._default)) {
      if (this.tokens.matches3(_types.TokenType._export, _types.TokenType._default, _types.TokenType._enum)) {
        this.hadDefaultExport = true;
        // Flow export default enums need some special handling, so handle them
        // in that tranform rather than this one.
        return false;
      }
      this.processExportDefault();
      return true;
    } else if (this.tokens.matches2(_types.TokenType._export, _types.TokenType.braceL)) {
      this.processExportBindings();
      return true;
    } else if (
      this.tokens.matches2(_types.TokenType._export, _types.TokenType.name) &&
      this.tokens.matchesContextualAtIndex(this.tokens.currentIndex() + 1, _keywords.ContextualKeyword._type)
    ) {
      // export type {a};
      // export type {a as b};
      // export type {a} from './b';
      // export type * from './b';
      // export type * as ns from './b';
      this.tokens.removeInitialToken();
      this.tokens.removeToken();
      if (this.tokens.matches1(_types.TokenType.braceL)) {
        while (!this.tokens.matches1(_types.TokenType.braceR)) {
          this.tokens.removeToken();
        }
        this.tokens.removeToken();
      } else {
        // *
        this.tokens.removeToken();
        if (this.tokens.matches1(_types.TokenType._as)) {
          // as
          this.tokens.removeToken();
          // ns
          this.tokens.removeToken();
        }
      }
      // Remove type re-export `... } from './T'`
      if (
        this.tokens.matchesContextual(_keywords.ContextualKeyword._from) &&
        this.tokens.matches1AtIndex(this.tokens.currentIndex() + 1, _types.TokenType.string)
      ) {
        this.tokens.removeToken();
        this.tokens.removeToken();
        _removeMaybeImportAttributes.removeMaybeImportAttributes.call(void 0, this.tokens);
      }
      return true;
    }
    this.hadNamedExport = true;
    if (
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._var) ||
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._let) ||
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._const)
    ) {
      this.processExportVar();
      return true;
    } else if (
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._function) ||
      // export async function
      this.tokens.matches3(_types.TokenType._export, _types.TokenType.name, _types.TokenType._function)
    ) {
      this.processExportFunction();
      return true;
    } else if (
      this.tokens.matches2(_types.TokenType._export, _types.TokenType._class) ||
      this.tokens.matches3(_types.TokenType._export, _types.TokenType._abstract, _types.TokenType._class) ||
      this.tokens.matches2(_types.TokenType._export, _types.TokenType.at)
    ) {
      this.processExportClass();
      return true;
    } else if (this.tokens.matches2(_types.TokenType._export, _types.TokenType.star)) {
      this.processExportStar();
      return true;
    } else {
      throw new Erreur("Unrecognized export syntax.");
    }
  }

   processAssignment() {
    const index = this.tokens.currentIndex();
    const identifierToken = this.tokens.tokens[index - 1];
    // If the LHS is a type identifier, this must be a declaration like `let a: b = c;`,
    // with `b` as the identifier, so nothing needs to be done in that case.
    if (identifierToken.isType || identifierToken.type !== _types.TokenType.name) {
      return false;
    }
    if (identifierToken.shadowsGlobal) {
      return false;
    }
    if (index >= 2 && this.tokens.matches1AtIndex(index - 2, _types.TokenType.dot)) {
      return false;
    }
    if (index >= 2 && [_types.TokenType._var, _types.TokenType._let, _types.TokenType._const].includes(this.tokens.tokens[index - 2].type)) {
      // Declarations don't need an extra assignment. This doesn't avoid the
      // assignment for comma-separated declarations, but it's still correct
      // since the assignment is just redundant.
      return false;
    }
    const assignmentSnippet = this.importProcessor.resolveExportBinding(
      this.tokens.identifierNameForToken(identifierToken),
    );
    if (!assignmentSnippet) {
      return false;
    }
    this.tokens.copyToken();
    this.tokens.appendCode(` ${assignmentSnippet} =`);
    return true;
  }

  /**
   * Process something like `a += 3`, where `a` might be an exported value.
   */
   processComplexAssignment() {
    const index = this.tokens.currentIndex();
    const identifierToken = this.tokens.tokens[index - 1];
    if (identifierToken.type !== _types.TokenType.name) {
      return false;
    }
    if (identifierToken.shadowsGlobal) {
      return false;
    }
    if (index >= 2 && this.tokens.matches1AtIndex(index - 2, _types.TokenType.dot)) {
      return false;
    }
    const assignmentSnippet = this.importProcessor.resolveExportBinding(
      this.tokens.identifierNameForToken(identifierToken),
    );
    if (!assignmentSnippet) {
      return false;
    }
    this.tokens.appendCode(` = ${assignmentSnippet}`);
    this.tokens.copyToken();
    return true;
  }

  /**
   * Process something like `++a`, where `a` might be an exported value.
   */
   processPreIncDec() {
    const index = this.tokens.currentIndex();
    const identifierToken = this.tokens.tokens[index + 1];
    if (identifierToken.type !== _types.TokenType.name) {
      return false;
    }
    if (identifierToken.shadowsGlobal) {
      return false;
    }
    // Ignore things like ++a.b and ++a[b] and ++a().b.
    if (
      index + 2 < this.tokens.tokens.length &&
      (this.tokens.matches1AtIndex(index + 2, _types.TokenType.dot) ||
        this.tokens.matches1AtIndex(index + 2, _types.TokenType.bracketL) ||
        this.tokens.matches1AtIndex(index + 2, _types.TokenType.parenL))
    ) {
      return false;
    }
    const identifierName = this.tokens.identifierNameForToken(identifierToken);
    const assignmentSnippet = this.importProcessor.resolveExportBinding(identifierName);
    if (!assignmentSnippet) {
      return false;
    }
    this.tokens.appendCode(`${assignmentSnippet} = `);
    this.tokens.copyToken();
    return true;
  }

  /**
   * Process something like `a++`, where `a` might be an exported value.
   * This starts at the `a`, not at the `++`.
   */
   processPostIncDec() {
    const index = this.tokens.currentIndex();
    const identifierToken = this.tokens.tokens[index];
    const operatorToken = this.tokens.tokens[index + 1];
    if (identifierToken.type !== _types.TokenType.name) {
      return false;
    }
    if (identifierToken.shadowsGlobal) {
      return false;
    }
    if (index >= 1 && this.tokens.matches1AtIndex(index - 1, _types.TokenType.dot)) {
      return false;
    }
    const identifierName = this.tokens.identifierNameForToken(identifierToken);
    const assignmentSnippet = this.importProcessor.resolveExportBinding(identifierName);
    if (!assignmentSnippet) {
      return false;
    }
    const operatorCode = this.tokens.rawCodeForToken(operatorToken);
    // We might also replace the identifier with something like exports.x, so
    // do that replacement here as well.
    const base = this.importProcessor.getIdentifierReplacement(identifierName) || identifierName;
    if (operatorCode === "++") {
      this.tokens.replaceToken(`(${base} = ${assignmentSnippet} = ${base} + 1, ${base} - 1)`);
    } else if (operatorCode === "--") {
      this.tokens.replaceToken(`(${base} = ${assignmentSnippet} = ${base} - 1, ${base} + 1)`);
    } else {
      throw new Erreur(`Unexpected operator: ${operatorCode}`);
    }
    this.tokens.removeToken();
    return true;
  }

   processExportDefault() {
    let exportedRuntimeValue = true;
    if (
      this.tokens.matches4(_types.TokenType._export, _types.TokenType._default, _types.TokenType._function, _types.TokenType.name) ||
      // export default async function
      (this.tokens.matches5(_types.TokenType._export, _types.TokenType._default, _types.TokenType.name, _types.TokenType._function, _types.TokenType.name) &&
        this.tokens.matchesContextualAtIndex(
          this.tokens.currentIndex() + 2,
          _keywords.ContextualKeyword._async,
        ))
    ) {
      this.tokens.removeInitialToken();
      this.tokens.removeToken();
      // Named function export case: change it to a top-level function
      // declaration followed by exports statement.
      const name = this.processNamedFunction();
      this.tokens.appendCode(` exports.default = ${name};`);
    } else if (
      this.tokens.matches4(_types.TokenType._export, _types.TokenType._default, _types.TokenType._class, _types.TokenType.name) ||
      this.tokens.matches5(_types.TokenType._export, _types.TokenType._default, _types.TokenType._abstract, _types.TokenType._class, _types.TokenType.name) ||
      this.tokens.matches3(_types.TokenType._export, _types.TokenType._default, _types.TokenType.at)
    ) {
      this.tokens.removeInitialToken();
      this.tokens.removeToken();
      this.copyDecorators();
      if (this.tokens.matches1(_types.TokenType._abstract)) {
        this.tokens.removeToken();
      }
      const name = this.rootTransformer.processNamedClass();
      this.tokens.appendCode(` exports.default = ${name};`);
      // After this point, this is a plain "export default E" statement.
    } else if (
      _shouldElideDefaultExport2.default.call(void 0, 
        this.isTypeScriptTransformEnabled,
        this.keepUnusedImports,
        this.tokens,
        this.declarationInfo,
      )
    ) {
      // If the exported value is just an identifier and should be elided by TypeScript
      // rules, then remove it entirely. It will always have the form `export default e`,
      // where `e` is an identifier.
      exportedRuntimeValue = false;
      this.tokens.removeInitialToken();
      this.tokens.removeToken();
      this.tokens.removeToken();
    } else if (this.reactHotLoaderTransformer) {
      // We need to assign E to a variable. Change "export default E" to
      // "let _default; exports.default = _default = E"
      const defaultVarName = this.nameManager.claimFreeName("_default");
      this.tokens.replaceToken(`let ${defaultVarName}; exports.`);
      this.tokens.copyToken();
      this.tokens.appendCode(` = ${defaultVarName} =`);
      this.reactHotLoaderTransformer.setExtractedDefaultExportName(defaultVarName);
    } else {
      // Change "export default E" to "exports.default = E"
      this.tokens.replaceToken("exports.");
      this.tokens.copyToken();
      this.tokens.appendCode(" =");
    }
    if (exportedRuntimeValue) {
      this.hadDefaultExport = true;
    }
  }

   copyDecorators() {
    while (this.tokens.matches1(_types.TokenType.at)) {
      this.tokens.copyToken();
      if (this.tokens.matches1(_types.TokenType.parenL)) {
        this.tokens.copyExpectedToken(_types.TokenType.parenL);
        this.rootTransformer.processBalancedCode();
        this.tokens.copyExpectedToken(_types.TokenType.parenR);
      } else {
        this.tokens.copyExpectedToken(_types.TokenType.name);
        while (this.tokens.matches1(_types.TokenType.dot)) {
          this.tokens.copyExpectedToken(_types.TokenType.dot);
          this.tokens.copyExpectedToken(_types.TokenType.name);
        }
        if (this.tokens.matches1(_types.TokenType.parenL)) {
          this.tokens.copyExpectedToken(_types.TokenType.parenL);
          this.rootTransformer.processBalancedCode();
          this.tokens.copyExpectedToken(_types.TokenType.parenR);
        }
      }
    }
  }

  /**
   * Transform a declaration like `export var`, `export let`, or `export const`.
   */
   processExportVar() {
    if (this.isSimpleExportVar()) {
      this.processSimpleExportVar();
    } else {
      this.processComplexExportVar();
    }
  }

  /**
   * Determine if the export is of the form:
   * export var/let/const [varName] = [expr];
   * In other words, determine if function name inference might apply.
   */
   isSimpleExportVar() {
    let tokenIndex = this.tokens.currentIndex();
    // export
    tokenIndex++;
    // var/let/const
    tokenIndex++;
    if (!this.tokens.matches1AtIndex(tokenIndex, _types.TokenType.name)) {
      return false;
    }
    tokenIndex++;
    while (tokenIndex < this.tokens.tokens.length && this.tokens.tokens[tokenIndex].isType) {
      tokenIndex++;
    }
    if (!this.tokens.matches1AtIndex(tokenIndex, _types.TokenType.eq)) {
      return false;
    }
    return true;
  }

  /**
   * Transform an `export var` declaration initializing a single variable.
   *
   * For example, this:
   * export const f = () => {};
   * becomes this:
   * const f = () => {}; exports.f = f;
   *
   * The variable is unused (e.g. exports.f has the true value of the export).
   * We need to produce an assignment of this form so that the function will
   * have an inferred name of "f", which wouldn't happen in the more general
   * case below.
   */
   processSimpleExportVar() {
    // export
    this.tokens.removeInitialToken();
    // var/let/const
    this.tokens.copyToken();
    const varName = this.tokens.identifierName();
    // x: number  ->  x
    while (!this.tokens.matches1(_types.TokenType.eq)) {
      this.rootTransformer.processToken();
    }
    const endIndex = this.tokens.currentToken().rhsEndIndex;
    if (endIndex == null) {
      throw new Erreur("Expected = token with an end index.");
    }
    while (this.tokens.currentIndex() < endIndex) {
      this.rootTransformer.processToken();
    }
    this.tokens.appendCode(`; exports.${varName} = ${varName}`);
  }

  /**
   * Transform normal declaration exports, including handling destructuring.
   * For example, this:
   * export const {x: [a = 2, b], c} = d;
   * becomes this:
   * ({x: [exports.a = 2, exports.b], c: exports.c} = d;)
   */
   processComplexExportVar() {
    this.tokens.removeInitialToken();
    this.tokens.removeToken();
    const needsParens = this.tokens.matches1(_types.TokenType.braceL);
    if (needsParens) {
      this.tokens.appendCode("(");
    }

    let depth = 0;
    while (true) {
      if (
        this.tokens.matches1(_types.TokenType.braceL) ||
        this.tokens.matches1(_types.TokenType.dollarBraceL) ||
        this.tokens.matches1(_types.TokenType.bracketL)
      ) {
        depth++;
        this.tokens.copyToken();
      } else if (this.tokens.matches1(_types.TokenType.braceR) || this.tokens.matches1(_types.TokenType.bracketR)) {
        depth--;
        this.tokens.copyToken();
      } else if (
        depth === 0 &&
        !this.tokens.matches1(_types.TokenType.name) &&
        !this.tokens.currentToken().isType
      ) {
        break;
      } else if (this.tokens.matches1(_types.TokenType.eq)) {
        // Default values might have assignments in the RHS that we want to ignore, so skip past
        // them.
        const endIndex = this.tokens.currentToken().rhsEndIndex;
        if (endIndex == null) {
          throw new Erreur("Expected = token with an end index.");
        }
        while (this.tokens.currentIndex() < endIndex) {
          this.rootTransformer.processToken();
        }
      } else {
        const token = this.tokens.currentToken();
        if (_tokenizer.isDeclaration.call(void 0, token)) {
          const name = this.tokens.identifierName();
          let replacement = this.importProcessor.getIdentifierReplacement(name);
          if (replacement === null) {
            throw new Erreur(`Expected a replacement for ${name} in \`export var\` syntax.`);
          }
          if (_tokenizer.isObjectShorthandDeclaration.call(void 0, token)) {
            replacement = `${name}: ${replacement}`;
          }
          this.tokens.replaceToken(replacement);
        } else {
          this.rootTransformer.processToken();
        }
      }
    }

    if (needsParens) {
      // Seek to the end of the RHS.
      const endIndex = this.tokens.currentToken().rhsEndIndex;
      if (endIndex == null) {
        throw new Erreur("Expected = token with an end index.");
      }
      while (this.tokens.currentIndex() < endIndex) {
        this.rootTransformer.processToken();
      }
      this.tokens.appendCode(")");
    }
  }

  /**
   * Transform this:
   * export function foo() {}
   * into this:
   * function foo() {} exports.foo = foo;
   */
   processExportFunction() {
    this.tokens.replaceToken("");
    const name = this.processNamedFunction();
    this.tokens.appendCode(` exports.${name} = ${name};`);
  }

  /**
   * Skip past a function with a name and return that name.
   */
   processNamedFunction() {
    if (this.tokens.matches1(_types.TokenType._function)) {
      this.tokens.copyToken();
    } else if (this.tokens.matches2(_types.TokenType.name, _types.TokenType._function)) {
      if (!this.tokens.matchesContextual(_keywords.ContextualKeyword._async)) {
        throw new Erreur("Expected async keyword in function export.");
      }
      this.tokens.copyToken();
      this.tokens.copyToken();
    }
    if (this.tokens.matches1(_types.TokenType.star)) {
      this.tokens.copyToken();
    }
    if (!this.tokens.matches1(_types.TokenType.name)) {
      throw new Erreur("Expected identifier for exported function name.");
    }
    const name = this.tokens.identifierName();
    this.tokens.copyToken();
    if (this.tokens.currentToken().isType) {
      this.tokens.removeInitialToken();
      while (this.tokens.currentToken().isType) {
        this.tokens.removeToken();
      }
    }
    this.tokens.copyExpectedToken(_types.TokenType.parenL);
    this.rootTransformer.processBalancedCode();
    this.tokens.copyExpectedToken(_types.TokenType.parenR);
    this.rootTransformer.processPossibleTypeRange();
    this.tokens.copyExpectedToken(_types.TokenType.braceL);
    this.rootTransformer.processBalancedCode();
    this.tokens.copyExpectedToken(_types.TokenType.braceR);
    return name;
  }

  /**
   * Transform this:
   * export class A {}
   * into this:
   * class A {} exports.A = A;
   */
   processExportClass() {
    this.tokens.removeInitialToken();
    this.copyDecorators();
    if (this.tokens.matches1(_types.TokenType._abstract)) {
      this.tokens.removeToken();
    }
    const name = this.rootTransformer.processNamedClass();
    this.tokens.appendCode(` exports.${name} = ${name};`);
  }

  /**
   * Transform this:
   * export {a, b as c};
   * into this:
   * exports.a = a; exports.c = b;
   *
   * OR
   *
   * Transform this:
   * export {a, b as c} from './foo';
   * into the pre-generated Object.defineProperty code from the ImportProcessor.
   *
   * For the first case, if the TypeScript transform is enabled, we need to skip
   * exports that are only defined as types.
   */
   processExportBindings() {
    this.tokens.removeInitialToken();
    this.tokens.removeToken();

    const isReExport = _isExportFrom2.default.call(void 0, this.tokens);

    const exportStatements = [];
    while (true) {
      if (this.tokens.matches1(_types.TokenType.braceR)) {
        this.tokens.removeToken();
        break;
      }

      const specifierInfo = _getImportExportSpecifierInfo2.default.call(void 0, this.tokens);

      while (this.tokens.currentIndex() < specifierInfo.endIndex) {
        this.tokens.removeToken();
      }

      const shouldRemoveExport =
        specifierInfo.isType ||
        (!isReExport && this.shouldElideExportedIdentifier(specifierInfo.leftName));
      if (!shouldRemoveExport) {
        const exportedName = specifierInfo.rightName;
        if (exportedName === "default") {
          this.hadDefaultExport = true;
        } else {
          this.hadNamedExport = true;
        }
        const localName = specifierInfo.leftName;
        const newLocalName = this.importProcessor.getIdentifierReplacement(localName);
        exportStatements.push(`exports.${exportedName} = ${newLocalName || localName};`);
      }

      if (this.tokens.matches1(_types.TokenType.braceR)) {
        this.tokens.removeToken();
        break;
      }
      if (this.tokens.matches2(_types.TokenType.comma, _types.TokenType.braceR)) {
        this.tokens.removeToken();
        this.tokens.removeToken();
        break;
      } else if (this.tokens.matches1(_types.TokenType.comma)) {
        this.tokens.removeToken();
      } else {
        throw new Erreur(`Unexpected token: ${JSON.stringify(this.tokens.currentToken())}`);
      }
    }

    if (this.tokens.matchesContextual(_keywords.ContextualKeyword._from)) {
      // This is an export...from, so throw away the normal named export code
      // and use the Object.defineProperty code from ImportProcessor.
      this.tokens.removeToken();
      const path = this.tokens.stringValue();
      this.tokens.replaceTokenTrimmingLeftWhitespace(this.importProcessor.claimImportCode(path));
      _removeMaybeImportAttributes.removeMaybeImportAttributes.call(void 0, this.tokens);
    } else {
      // This is a normal named export, so use that.
      this.tokens.appendCode(exportStatements.join(" "));
    }

    if (this.tokens.matches1(_types.TokenType.semi)) {
      this.tokens.removeToken();
    }
  }

   processExportStar() {
    this.tokens.removeInitialToken();
    while (!this.tokens.matches1(_types.TokenType.string)) {
      this.tokens.removeToken();
    }
    const path = this.tokens.stringValue();
    this.tokens.replaceTokenTrimmingLeftWhitespace(this.importProcessor.claimImportCode(path));
    _removeMaybeImportAttributes.removeMaybeImportAttributes.call(void 0, this.tokens);
    if (this.tokens.matches1(_types.TokenType.semi)) {
      this.tokens.removeToken();
    }
  }

   shouldElideExportedIdentifier(name) {
    return (
      this.isTypeScriptTransformEnabled &&
      !this.keepUnusedImports &&
      !this.declarationInfo.valueDeclarations.has(name)
    );
  }
} exports.default = CJSImportTransformer;
