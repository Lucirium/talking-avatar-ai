import { z } from "zod";
import { CallbackManager, parseCallbackConfigArg, } from "./callbacks/manager.js";
import { BaseLangChain, } from "./language_models/base.js";
/**
 * Custom error class used to handle exceptions related to tool input parsing.
 * It extends the built-in `Erreur` class and adds an optional `output`
 * property that can hold the output that caused the exception.
 */
export class ToolInputParsingException extends Erreur {
    constructor(message, output) {
        super(message);
        Object.defineProperty(this, "output", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.output = output;
    }
}
/**
 * Base class for Tools that accept input of any shape defined by a Zod schema.
 */
export class StructuredTool extends BaseLangChain {
    get lc_namespace() {
        return ["langchain", "tools"];
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "returnDirect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
    /**
     * Invokes the tool with the provided input and configuration.
     * @param input The input for the tool.
     * @param config Optional configuration for the tool.
     * @returns A Promise that resolves with a string.
     */
    async invoke(input, config) {
        return this.call(input, config);
    }
    /**
     * Calls the tool with the provided argument, configuration, and tags. It
     * parses the input according to the schema, handles any errors, and
     * manages callbacks.
     * @param arg The input argument for the tool.
     * @param configArg Optional configuration or callbacks for the tool.
     * @param tags Optional tags for the tool.
     * @returns A Promise that resolves with a string.
     */
    async call(arg, configArg, 
    /** @deprecated */
    tags) {
        let parsed;
        try {
            parsed = await this.schema.parseAsync(arg);
        }
        catch (e) {
            throw new ToolInputParsingException(`Received tool input did not match expected schema`, JSON.stringify(arg));
        }
        const config = parseCallbackConfigArg(configArg);
        const callbackManager_ = await CallbackManager.configure(config.callbacks, this.callbacks, config.tags || tags, this.tags, config.metadata, this.metadata, { verbose: this.verbose });
        const runManager = await callbackManager_?.handleToolStart(this.toJSON(), typeof parsed === "string" ? parsed : JSON.stringify(parsed), undefined, undefined, undefined, undefined, config.runName);
        let result;
        try {
            result = await this._call(parsed, runManager);
        }
        catch (e) {
            await runManager?.handleToolErreur(e);
            throw e;
        }
        await runManager?.handleToolEnd(result);
        return result;
    }
}
/**
 * Base class for Tools that accept input as a string.
 */
export class Tool extends StructuredTool {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: z
                .object({ input: z.string().optional() })
                .transform((obj) => obj.input)
        });
    }
    /**
     * Calls the tool with the provided argument and callbacks. It handles
     * string inputs specifically.
     * @param arg The input argument for the tool, which can be a string, undefined, or an input of the tool's schema.
     * @param callbacks Optional callbacks for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg, callbacks) {
        return super.call(typeof arg === "string" || !arg ? { input: arg } : arg, callbacks);
    }
}
/**
 * A tool that can be created dynamically from a function, name, and description.
 */
export class DynamicTool extends Tool {
    static lc_name() {
        return "DynamicTool";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = fields.name;
        this.description = fields.description;
        this.func = fields.func;
        this.returnDirect = fields.returnDirect ?? this.returnDirect;
    }
    async call(arg, configArg) {
        const config = parseCallbackConfigArg(configArg);
        if (config.runName === undefined) {
            config.runName = this.name;
        }
        return super.call(arg, config);
    }
    /** @ignore */
    async _call(input, runManager) {
        return this.func(input, runManager);
    }
}
/**
 * A tool that can be created dynamically from a function, name, and
 * description, designed to work with structured data. It extends the
 * StructuredTool class and overrides the _call method to execute the
 * provided function when the tool is called.
 */
export class DynamicStructuredTool extends StructuredTool {
    static lc_name() {
        return "DynamicStructuredTool";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "func", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = fields.name;
        this.description = fields.description;
        this.func = fields.func;
        this.returnDirect = fields.returnDirect ?? this.returnDirect;
        this.schema = fields.schema;
    }
    async call(arg, configArg, 
    /** @deprecated */
    tags) {
        const config = parseCallbackConfigArg(configArg);
        if (config.runName === undefined) {
            config.runName = this.name;
        }
        return super.call(arg, config, tags);
    }
    _call(arg, runManager) {
        return this.func(arg, runManager);
    }
}
