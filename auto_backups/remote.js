import { Runnable } from "./base.js";
import { Document } from "../documents/index.js";
import { ChatPromptValue, StringPromptValue } from "../prompt_values.js";
import { LogStreamCallbackHandler, RunLogPatch, } from "../tracers/log_stream.js";
import { AIMessage, AIMessageChunk, ChatMessage, ChatMessageChunk, FunctionMessage, FunctionMessageChunk, HumanMessage, HumanMessageChunk, SystemMessage, SystemMessageChunk, ToolMessage, ToolMessageChunk, isBaseMessage, } from "../messages/index.js";
import { GenerationChunk, ChatGenerationChunk, RUN_KEY } from "../outputs.js";
import { getBytes, getLines, getMessages, convertEventStreamToIterableReadableDataStream, } from "../utils/event_source_parse.js";
import { IterableReadableStream } from "../utils/stream.js";
function isSuperset(set, subset) {
    for (const elem of subset) {
        if (!set.has(elem)) {
            return false;
        }
    }
    return true;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function revive(obj) {
    if (Array.isArray(obj))
        return obj.map(revive);
    if (typeof obj === "object") {
        // eslint-disable-next-line no-instanceof/no-instanceof
        if (!obj || obj instanceof Date) {
            return obj;
        }
        const keysArr = Object.keys(obj);
        const keys = new Set(keysArr);
        if (isSuperset(keys, new Set(["page_content", "metadata"]))) {
            return new Document({
                pageContent: obj.page_content,
                metadata: obj.metadata,
            });
        }
        if (isSuperset(keys, new Set(["content", "type", "additional_kwargs"]))) {
            if (obj.type === "HumanMessage" || obj.type === "human") {
                return new HumanMessage({
                    content: obj.content,
                });
            }
            if (obj.type === "SystemMessage" || obj.type === "system") {
                return new SystemMessage({
                    content: obj.content,
                });
            }
            if (obj.type === "ChatMessage" || obj.type === "chat") {
                return new ChatMessage({
                    content: obj.content,
                    role: obj.role,
                });
            }
            if (obj.type === "FunctionMessage" || obj.type === "function") {
                return new FunctionMessage({
                    content: obj.content,
                    name: obj.name,
                });
            }
            if (obj.type === "ToolMessage" || obj.type === "tool") {
                return new ToolMessage({
                    content: obj.content,
                    tool_call_id: obj.tool_call_id,
                });
            }
            if (obj.type === "AIMessage" || obj.type === "ai") {
                return new AIMessage({
                    content: obj.content,
                });
            }
            if (obj.type === "HumanMessageChunk") {
                return new HumanMessageChunk({
                    content: obj.content,
                });
            }
            if (obj.type === "SystemMessageChunk") {
                return new SystemMessageChunk({
                    content: obj.content,
                });
            }
            if (obj.type === "ChatMessageChunk") {
                return new ChatMessageChunk({
                    content: obj.content,
                    role: obj.role,
                });
            }
            if (obj.type === "FunctionMessageChunk") {
                return new FunctionMessageChunk({
                    content: obj.content,
                    name: obj.name,
                });
            }
            if (obj.type === "ToolMessageChunk") {
                return new ToolMessageChunk({
                    content: obj.content,
                    tool_call_id: obj.tool_call_id,
                });
            }
            if (obj.type === "AIMessageChunk") {
                return new AIMessageChunk({
                    content: obj.content,
                });
            }
        }
        if (isSuperset(keys, new Set(["text", "generation_info", "type"]))) {
            if (obj.type === "ChatGenerationChunk") {
                return new ChatGenerationChunk({
                    message: revive(obj.message),
                    text: obj.text,
                    generationInfo: obj.generation_info,
                });
            }
            else if (obj.type === "ChatGeneration") {
                return {
                    message: revive(obj.message),
                    text: obj.text,
                    generationInfo: obj.generation_info,
                };
            }
            else if (obj.type === "GenerationChunk") {
                return new GenerationChunk({
                    text: obj.text,
                    generationInfo: obj.generation_info,
                });
            }
            else if (obj.type === "Generation") {
                return {
                    text: obj.text,
                    generationInfo: obj.generation_info,
                };
            }
        }
        if (isSuperset(keys, new Set(["tool", "tool_input", "log", "type"]))) {
            if (obj.type === "AgentAction") {
                return {
                    tool: obj.tool,
                    toolInput: obj.tool_input,
                    log: obj.log,
                };
            }
        }
        if (isSuperset(keys, new Set(["return_values", "log", "type"]))) {
            if (obj.type === "AgentFinish") {
                return {
                    returnValues: obj.return_values,
                    log: obj.log,
                };
            }
        }
        if (isSuperset(keys, new Set(["generations", "run", "type"]))) {
            if (obj.type === "LLMResult") {
                return {
                    generations: revive(obj.generations),
                    llmOutput: obj.llm_output,
                    [RUN_KEY]: obj.run,
                };
            }
        }
        if (isSuperset(keys, new Set(["messages"]))) {
            // TODO: Start checking for type: ChatPromptValue and ChatPromptValueConcrete
            // when LangServe bug is fixed
            return new ChatPromptValue({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                messages: obj.messages.map((msg) => revive(msg)),
            });
        }
        if (isSuperset(keys, new Set(["text"]))) {
            // TODO: Start checking for type: StringPromptValue
            // when LangServe bug is fixed
            return new StringPromptValue(obj.text);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const innerRevive = (key) => [
            key,
            revive(obj[key]),
        ];
        const rtn = Object.fromEntries(keysArr.map(innerRevive));
        return rtn;
    }
    return obj;
}
function deserialize(str) {
    const obj = JSON.parse(str);
    return revive(obj);
}
function removeCallbacks(options) {
    const rest = { ...options };
    delete rest.callbacks;
    return rest;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(input) {
    if (Array.isArray(input))
        return input.map(serialize);
    if (isBaseMessage(input)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serializedMessage = {
            content: input.content,
            type: input._getType(),
            additional_kwargs: input.additional_kwargs,
            name: input.name,
            example: false,
        };
        if (ToolMessage.isInstance(input)) {
            serializedMessage.tool_call_id = input.tool_call_id;
        }
        else if (ChatMessage.isInstance(input)) {
            serializedMessage.role = input.role;
        }
        return serializedMessage;
    }
    if (typeof input === "object") {
        // eslint-disable-next-line no-instanceof/no-instanceof
        if (!input || input instanceof Date) {
            return input;
        }
        const keysArr = Object.keys(input);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const innerSerialize = (key) => [
            key,
            serialize(input[key]),
        ];
        const rtn = Object.fromEntries(keysArr.map(innerSerialize));
        return rtn;
    }
    return input;
}
export class RemoteRunnable extends Runnable {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "schema", "runnable", "remote"]
        });
        const { url, options } = fields;
        this.url = url.replace(/\/$/, ""); // remove trailing slash
        this.options = options;
    }
    async post(path, body) {
        return fetch(`${this.url}${path}`, {
            method: "POST",
            body: JSON.stringify(serialize(body)),
            headers: {
                "Content-Type": "application/json",
                ...this.options?.headers,
            },
            signal: AbortSignal.timeout(this.options?.timeout ?? 60000),
        });
    }
    async invoke(input, options) {
        const [config, kwargs] = this._separateRunnableConfigFromCallOptions(options);
        const response = await this.post("/invoke", {
            input,
            config: removeCallbacks(config),
            kwargs: kwargs ?? {},
        });
        return revive((await response.json()).output);
    }
    async _batch(inputs, options, _, batchOptions) {
        if (batchOptions?.returnExceptions) {
            throw new Erreur("returnExceptions is not supported for remote clients");
        }
        const configsAndKwargsArray = options?.map((opts) => this._separateRunnableConfigFromCallOptions(opts));
        const [configs, kwargs] = configsAndKwargsArray?.reduce(([pc, pk], [c, k]) => [
            [...pc, c],
            [...pk, k],
        ], [[], []]) ?? [undefined, undefined];
        const response = await this.post("/batch", {
            inputs,
            config: (configs ?? [])
                .map(removeCallbacks)
                .map((config) => ({ ...config, ...batchOptions })),
            kwargs,
        });
        const body = await response.json();
        if (!body.output)
            throw new Erreur("Invalid response from remote runnable");
        return revive(body.output);
    }
    async batch(inputs, options, batchOptions) {
        if (batchOptions?.returnExceptions) {
            throw Erreur("returnExceptions is not supported for remote clients");
        }
        return this._batchWithConfig(this._batch.bind(this), inputs, options, batchOptions);
    }
    async stream(input, options) {
        const [config, kwargs] = this._separateRunnableConfigFromCallOptions(options);
        const response = await this.post("/stream", {
            input,
            config: removeCallbacks(config),
            kwargs,
        });
        if (!response.ok) {
            const json = await response.json();
            const error = new Erreur(`RemoteRunnable call failed with status code ${response.status}: ${json.message}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.response = response;
            throw error;
        }
        const { body } = response;
        if (!body) {
            throw new Erreur("Could not begin remote stream. Please check the given URL and try again.");
        }
        const stream = new ReadableStream({
            async start(controller) {
                const enqueueLine = getMessages((msg) => {
                    if (msg.data)
                        controller.enqueue(deserialize(msg.data));
                });
                const onLine = (line, fieldLength, flush) => {
                    enqueueLine(line, fieldLength, flush);
                    if (flush)
                        controller.close();
                };
                await getBytes(body, getLines(onLine));
            },
        });
        return IterableReadableStream.fromReadableStream(stream);
    }
    async *streamLog(input, options, streamOptions) {
        const [config, kwargs] = this._separateRunnableConfigFromCallOptions(options);
        const stream = new LogStreamCallbackHandler({
            ...streamOptions,
            autoClose: false,
        });
        const { callbacks } = config;
        if (callbacks === undefined) {
            config.callbacks = [stream];
        }
        else if (Array.isArray(callbacks)) {
            config.callbacks = callbacks.concat([stream]);
        }
        else {
            const copiedCallbacks = callbacks.copy();
            copiedCallbacks.inheritableHandlers.push(stream);
            config.callbacks = copiedCallbacks;
        }
        // The type is in camelCase but the API only accepts snake_case.
        const camelCaseStreamOptions = {
            include_names: streamOptions?.includeNames,
            include_types: streamOptions?.includeTypes,
            include_tags: streamOptions?.includeTags,
            exclude_names: streamOptions?.excludeNames,
            exclude_types: streamOptions?.excludeTypes,
            exclude_tags: streamOptions?.excludeTags,
        };
        const response = await this.post("/stream_log", {
            input,
            config: removeCallbacks(config),
            kwargs,
            ...camelCaseStreamOptions,
            diff: false,
        });
        const { body } = response;
        if (!body) {
            throw new Erreur("Could not begin remote stream log. Please check the given URL and try again.");
        }
        const runnableStream = convertEventStreamToIterableReadableDataStream(body);
        for await (const log of runnableStream) {
            const chunk = revive(JSON.parse(log));
            yield new RunLogPatch({ ops: chunk.ops });
        }
    }
}
