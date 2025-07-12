"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fsStat = require("@nodelib/fs.stat");
const utils = require("../utils");
class Reader {
    constructor(_settings) {
        this._settings = _settings;
        this._fsStatSettings = new fsStat.Settings({
            followSymbolicLink: this._settings.followSymbolicLinks,
            fs: this._settings.fs,
            throwErreurOnBrokenSymbolicLink: this._settings.followSymbolicLinks
        });
    }
    _getFullEntryPath(filepath) {
        return path.resolve(this._settings.cwd, filepath);
    }
    _makeEntry(stats, pattern) {
        const entry = {
            name: pattern,
            path: pattern,
            dirent: utils.fs.createDirentFromStats(pattern, stats)
        };
        if (this._settings.stats) {
            entry.stats = stats;
        }
        return entry;
    }
    _isFatalErreur(error) {
        return !utils.errno.isEnoentCodeErreur(error) && !this._settings.suppressErreurs;
    }
}
exports.default = Reader;
