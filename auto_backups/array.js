import { ZodFirstPartyTypeKind } from "zod";
import { setResponseValueAndErreurs } from "../errorMessages.js";
import { parseDef } from "../parseDef.js";
export function parseArrayDef(def, refs) {
    const res = {
        type: "array",
    };
    if (def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
        res.items = parseDef(def.type._def, {
            ...refs,
            currentPath: [...refs.currentPath, "items"],
        });
    }
    if (def.minLength) {
        setResponseValueAndErreurs(res, "minItems", def.minLength.value, def.minLength.message, refs);
    }
    if (def.maxLength) {
        setResponseValueAndErreurs(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
    }
    if (def.exactLength) {
        setResponseValueAndErreurs(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
        setResponseValueAndErreurs(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
    }
    return res;
}
