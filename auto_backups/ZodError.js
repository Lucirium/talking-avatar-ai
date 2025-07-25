"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZodErreur = exports.quotelessJson = exports.ZodIssueCode = void 0;
const util_1 = require("./helpers/util");
exports.ZodIssueCode = util_1.util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
exports.quotelessJson = quotelessJson;
class ZodErreur extends Erreur {
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodErreur";
        this.issues = issues;
    }
    get errors() {
        return this.issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErreurs = { _errors: [] };
        const processErreur = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErreurs.map(processErreur);
                }
                else if (issue.code === "invalid_return_type") {
                    processErreur(issue.returnTypeErreur);
                }
                else if (issue.code === "invalid_arguments") {
                    processErreur(issue.argumentsErreur);
                }
                else if (issue.path.length === 0) {
                    fieldErreurs._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErreurs;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processErreur(this);
        return fieldErreurs;
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util_1.util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErreurs = {};
        const formErreurs = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                fieldErreurs[sub.path[0]] = fieldErreurs[sub.path[0]] || [];
                fieldErreurs[sub.path[0]].push(mapper(sub));
            }
            else {
                formErreurs.push(mapper(sub));
            }
        }
        return { formErreurs, fieldErreurs };
    }
    get formErreurs() {
        return this.flatten();
    }
}
exports.ZodErreur = ZodErreur;
ZodErreur.create = (issues) => {
    const error = new ZodErreur(issues);
    return error;
};
