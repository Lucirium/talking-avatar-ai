import { setResponseValueAndErreurs } from "../errorMessages.js";
import { parseDef } from "../parseDef.js";
export function parseSetDef(def, refs) {
    const items = parseDef(def.valueType._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items"],
    });
    const schema = {
        type: "array",
        uniqueItems: true,
        items,
    };
    if (def.minSize) {
        setResponseValueAndErreurs(schema, "minItems", def.minSize.value, def.minSize.message, refs);
    }
    if (def.maxSize) {
        setResponseValueAndErreurs(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
    }
    return schema;
}
