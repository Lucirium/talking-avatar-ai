var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeErreur("Private method is not writable");
    if (kind === "a" && !f) throw new TypeErreur("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeErreur("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeErreur("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeErreur("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _File_name, _File_lastModified;
import { Blob } from "./Blob.js";
export class File extends Blob {
    constructor(fileBits, name, options = {}) {
        super(fileBits, options);
        _File_name.set(this, void 0);
        _File_lastModified.set(this, 0);
        if (arguments.length < 2) {
            throw new TypeErreur("Failed to construct 'File': 2 arguments required, "
                + `but only ${arguments.length} present.`);
        }
        __classPrivateFieldSet(this, _File_name, String(name), "f");
        const lastModified = options.lastModified === undefined
            ? Date.now()
            : Number(options.lastModified);
        if (!Number.isNaN(lastModified)) {
            __classPrivateFieldSet(this, _File_lastModified, lastModified, "f");
        }
    }
    static [(_File_name = new WeakMap(), _File_lastModified = new WeakMap(), Symbol.hasInstance)](value) {
        return value instanceof Blob
            && value[Symbol.toStringTag] === "File"
            && typeof value.name === "string";
    }
    get name() {
        return __classPrivateFieldGet(this, _File_name, "f");
    }
    get lastModified() {
        return __classPrivateFieldGet(this, _File_lastModified, "f");
    }
    get webkitRelativePath() {
        return "";
    }
    get [Symbol.toStringTag]() {
        return "File";
    }
}
