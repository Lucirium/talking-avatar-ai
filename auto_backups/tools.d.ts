import { z } from "zod";
import { CallbackManagerForToolRun, Callbacks } from "./callbacks/manager.js";
import { BaseLangChain, type BaseLangChainParams } from "./language_models/base.js";
import type { RunnableConfig } from "./runnables/config.js";
import type { RunnableInterface } from "./runnables/base.js";
/**
 * Parameters for the Tool classes.
 */
export interface ToolParams extends BaseLangChainParams {
}
/**
 * Custom error class used to handle exceptions related to tool input parsing.
 * It extends the built-in `Error` class and adds an optional `output`
 * property that can hold the output that caused the exception.
 */
export declare class ToolInputParsingException extends Error {
    output?: string;
    constructor(message: string, output?: string);
}
export interface StructuredToolInterface<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends RunnableInterface<(z.output<T> extends string ? string : never) | z.input<T>, string> {
    lc_namespace: string[];
    schema: T | z.ZodEffects<T>;
    /**
     * Calls the tool with the provided argument, configuration, and tags. It
     * parses the input according to the schema, handles any errors, and
     * manages callbacks.
     * @param arg The input argument for the tool.
     * @param configArg Optional configuration or callbacks for the tool.
     * @param tags Optional tags for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: (z.output<T> extends string ? string : never) | z.input<T>, configArg?: Callbacks | RunnableConfig, 
    /** @deprecated */
    tags?: string[]): Promise<string>;
    name: string;
    description: string;
    returnDirect: boolean;
}
/**
 * Base class for Tools that accept input of any shape defined by a Zod schema.
 */
export declare abstract class StructuredTool<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends BaseLangChain<(z.output<T> extends string ? string : never) | z.input<T>, string> {
    abstract schema: T | z.ZodEffects<T>;
    get lc_namespace(): string[];
    constructor(fields?: ToolParams);
    protected abstract _call(arg: z.output<T>, runManager?: CallbackManagerForToolRun): Promise<string>;
    /**
     * Invokes the tool with the provided input and configuration.
     * @param input The input for the tool.
     * @param config Optional configuration for the tool.
     * @returns A Promise that resolves with a string.
     */
    invoke(input: (z.output<T> extends string ? string : never) | z.input<T>, config?: RunnableConfig): Promise<string>;
    /**
     * Calls the tool with the provided argument, configuration, and tags. It
     * parses the input according to the schema, handles any errors, and
     * manages callbacks.
     * @param arg The input argument for the tool.
     * @param configArg Optional configuration or callbacks for the tool.
     * @param tags Optional tags for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: (z.output<T> extends string ? string : never) | z.input<T>, configArg?: Callbacks | RunnableConfig, 
    /** @deprecated */
    tags?: string[]): Promise<string>;
    abstract name: string;
    abstract description: string;
    returnDirect: boolean;
}
export interface ToolInterface extends StructuredToolInterface {
    /**
     * Calls the tool with the provided argument and callbacks. It handles
     * string inputs specifically.
     * @param arg The input argument for the tool, which can be a string, undefined, or an input of the tool's schema.
     * @param callbacks Optional callbacks for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: string | undefined | z.input<this["schema"]>, callbacks?: Callbacks | RunnableConfig): Promise<string>;
}
/**
 * Base class for Tools that accept input as a string.
 */
export declare abstract class Tool extends StructuredTool {
    schema: z.ZodEffects<z.ZodObject<{
        input: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        input?: string | undefined;
    }, {
        input?: string | undefined;
    }>, string | undefined, {
        input?: string | undefined;
    }>;
    constructor(fields?: ToolParams);
    /**
     * Calls the tool with the provided argument and callbacks. It handles
     * string inputs specifically.
     * @param arg The input argument for the tool, which can be a string, undefined, or an input of the tool's schema.
     * @param callbacks Optional callbacks for the tool.
     * @returns A Promise that resolves with a string.
     */
    call(arg: string | undefined | z.input<this["schema"]>, callbacks?: Callbacks | RunnableConfig): Promise<string>;
}
export interface BaseDynamicToolInput extends ToolParams {
    name: string;
    description: string;
    returnDirect?: boolean;
}
/**
 * Interface for the input parameters of the DynamicTool class.
 */
export interface DynamicToolInput extends BaseDynamicToolInput {
    func: (input: string, runManager?: CallbackManagerForToolRun) => Promise<string>;
}
/**
 * Interface for the input parameters of the DynamicStructuredTool class.
 */
export interface DynamicStructuredToolInput<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends BaseDynamicToolInput {
    func: (input: z.infer<T>, runManager?: CallbackManagerForToolRun) => Promise<string>;
    schema: T;
}
/**
 * A tool that can be created dynamically from a function, name, and description.
 */
export declare class DynamicTool extends Tool {
    static lc_name(): string;
    name: string;
    description: string;
    func: DynamicToolInput["func"];
    constructor(fields: DynamicToolInput);
    call(arg: string | undefined | z.input<this["schema"]>, configArg?: RunnableConfig | Callbacks): Promise<string>;
    /** @ignore */
    _call(input: string, runManager?: CallbackManagerForToolRun): Promise<string>;
}
/**
 * A tool that can be created dynamically from a function, name, and
 * description, designed to work with structured data. It extends the
 * StructuredTool class and overrides the _call method to execute the
 * provided function when the tool is called.
 */
export declare class DynamicStructuredTool<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends StructuredTool {
    static lc_name(): string;
    name: string;
    description: string;
    func: DynamicStructuredToolInput["func"];
    schema: T;
    constructor(fields: DynamicStructuredToolInput<T>);
    call(arg: z.output<T>, configArg?: RunnableConfig | Callbacks, 
    /** @deprecated */
    tags?: string[]): Promise<string>;
    protected _call(arg: z.output<T>, runManager?: CallbackManagerForToolRun): Promise<string>;
}
