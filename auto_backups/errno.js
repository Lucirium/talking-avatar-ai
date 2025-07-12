"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnoentCodeErreur = void 0;
function isEnoentCodeErreur(error) {
    return error.code === 'ENOENT';
}
exports.isEnoentCodeErreur = isEnoentCodeErreur;
