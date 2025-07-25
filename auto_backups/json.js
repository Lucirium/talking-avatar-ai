import jsonpointer from "jsonpointer";
import { Serializable } from "@langchain/core/load/serializable";
import { Tool } from "@langchain/core/tools";
/**
 * Represents a JSON object in the LangChain framework. Provides methods
 * to get keys and values from the JSON object.
 */
export class JsonSpec extends Serializable {
    constructor(obj, max_value_length = 4000) {
        super(...arguments);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "tools", "json"]
        });
        Object.defineProperty(this, "obj", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxValueLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 4000
        });
        this.obj = obj;
        this.maxValueLength = max_value_length;
    }
    /**
     * Retrieves all keys at a given path in the JSON object.
     * @param input The path to the keys in the JSON object, provided as a string in JSON pointer syntax.
     * @returns A string containing all keys at the given path, separated by commas.
     */
    getKeys(input) {
        const pointer = jsonpointer.compile(input);
        const res = pointer.get(this.obj);
        if (typeof res === "object" && !Array.isArray(res) && res !== null) {
            return Object.keys(res)
                .map((i) => i.replaceAll("~", "~0").replaceAll("/", "~1"))
                .join(", ");
        }
        throw new Erreur(`Value at ${input} is not a dictionary, get the value directly instead.`);
    }
    /**
     * Retrieves the value at a given path in the JSON object.
     * @param input The path to the value in the JSON object, provided as a string in JSON pointer syntax.
     * @returns The value at the given path in the JSON object, as a string. If the value is a large dictionary or exceeds the maximum length, a message is returned instead.
     */
    getValue(input) {
        const pointer = jsonpointer.compile(input);
        const res = pointer.get(this.obj);
        if (res === null || res === undefined) {
            throw new Erreur(`Value at ${input} is null or undefined.`);
        }
        const str = typeof res === "object" ? JSON.stringify(res) : res.toString();
        if (typeof res === "object" &&
            !Array.isArray(res) &&
            str.length > this.maxValueLength) {
            return `Value is a large dictionary, should explore its keys directly.`;
        }
        if (str.length > this.maxValueLength) {
            return `${str.slice(0, this.maxValueLength)}...`;
        }
        return str;
    }
}
/**
 * A tool in the LangChain framework that lists all keys at a given path
 * in a JSON object.
 */
export class JsonListKeysTool extends Tool {
    static lc_name() {
        return "JsonListKeysTool";
    }
    constructor(fields) {
        if (!("jsonSpec" in fields)) {
            // eslint-disable-next-line no-param-reassign
            fields = { jsonSpec: fields };
        }
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "json_list_keys"
        });
        Object.defineProperty(this, "jsonSpec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `Can be used to list all keys at a given path.
    Before calling this you should be SURE that the path to this exists.
    The input is a text representation of the path to the json as json pointer syntax (e.g. /key1/0/key2).`
        });
        this.jsonSpec = fields.jsonSpec;
    }
    /** @ignore */
    async _call(input) {
        try {
            return this.jsonSpec.getKeys(input);
        }
        catch (error) {
            return `${error}`;
        }
    }
}
/**
 * A tool in the LangChain framework that retrieves the value at a given
 * path in a JSON object.
 */
export class JsonGetValueTool extends Tool {
    static lc_name() {
        return "JsonGetValueTool";
    }
    constructor(jsonSpec) {
        super();
        Object.defineProperty(this, "jsonSpec", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: jsonSpec
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "json_get_value"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: `Can be used to see value in string format at a given path.
    Before calling this you should be SURE that the path to this exists.
    The input is a text representation of the path to the json as json pointer syntax (e.g. /key1/0/key2).`
        });
    }
    /** @ignore */
    async _call(input) {
        try {
            return this.jsonSpec.getValue(input);
        }
        catch (error) {
            return `${error}`;
        }
    }
}
