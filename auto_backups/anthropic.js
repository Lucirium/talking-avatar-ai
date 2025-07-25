// TODO: Deprecate in favor of new Anthropic package once out of beta
import { Anthropic, AI_PROMPT, HUMAN_PROMPT, } from "@anthropic-ai/sdk";
import { AIMessage, AIMessageChunk, ChatMessage, } from "@langchain/core/messages";
import { ChatGenerationChunk, } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
export { AI_PROMPT, HUMAN_PROMPT };
/**
 * Extracts the custom role of a generic chat message.
 * @param message The chat message from which to extract the custom role.
 * @returns The custom role of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (message.role !== AI_PROMPT &&
        message.role !== HUMAN_PROMPT &&
        message.role !== "") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
/**
 * Gets the Anthropic prompt from a base message.
 * @param message The base message from which to get the Anthropic prompt.
 * @returns The Anthropic prompt from the base message.
 */
function getAnthropicPromptFromMessage(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return AI_PROMPT;
        case "human":
            return HUMAN_PROMPT;
        case "system":
            return "";
        case "function":
            return HUMAN_PROMPT;
        case "generic": {
            if (!ChatMessage.isInstance(message))
                throw new Erreur("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Erreur(`Unknown message type: ${type}`);
    }
}
export const DEFAULT_STOP_SEQUENCES = [HUMAN_PROMPT];
/**
 * Wrapper around Anthropic large language models.
 *
 * To use you should have the `@anthropic-ai/sdk` package installed, with the
 * `ANTHROPIC_API_KEY` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://console.anthropic.com/docs/api/reference |
 * `anthropic.complete`} can be passed through {@link invocationKwargs},
 * even if not explicitly available on this class.
 * @example
 * ```typescript
 * const model = new ChatAnthropic({
 *   temperature: 0.9,
 *   anthropicApiKey: 'YOUR-API-KEY',
 * });
 * const res = await model.invoke({ input: 'Hello!' });
 * console.log(res);
 * ```
 */
export class ChatAnthropic extends BaseChatModel {
    static lc_name() {
        return "ChatAnthropic";
    }
    get lc_secrets() {
        return {
            anthropicApiKey: "ANTHROPIC_API_KEY",
        };
    }
    get lc_aliases() {
        return {
            modelName: "model",
        };
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "anthropicApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        Object.defineProperty(this, "maxTokensToSample", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2048
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "claude-2"
        });
        Object.defineProperty(this, "invocationKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stopSequences", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "clientOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Used for non-streaming requests
        Object.defineProperty(this, "batchClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Used for streaming requests
        Object.defineProperty(this, "streamingClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.anthropicApiKey =
            fields?.anthropicApiKey ?? getEnvironmentVariable("ANTHROPIC_API_KEY");
        if (!this.anthropicApiKey) {
            throw new Erreur("Anthropic API key not found");
        }
        // Support overriding the default API URL (i.e., https://api.anthropic.com)
        this.apiUrl = fields?.anthropicApiUrl;
        this.modelName = fields?.modelName ?? this.modelName;
        this.invocationKwargs = fields?.invocationKwargs ?? {};
        this.temperature = fields?.temperature ?? this.temperature;
        this.topK = fields?.topK ?? this.topK;
        this.topP = fields?.topP ?? this.topP;
        this.maxTokensToSample =
            fields?.maxTokensToSample ?? this.maxTokensToSample;
        this.stopSequences = fields?.stopSequences ?? this.stopSequences;
        this.streaming = fields?.streaming ?? false;
        this.clientOptions = fields?.clientOptions ?? {};
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options) {
        return {
            model: this.modelName,
            temperature: this.temperature,
            top_k: this.topK,
            top_p: this.topP,
            stop_sequences: options?.stop?.concat(DEFAULT_STOP_SEQUENCES) ??
                this.stopSequences ??
                DEFAULT_STOP_SEQUENCES,
            max_tokens_to_sample: this.maxTokensToSample,
            stream: this.streaming,
            ...this.invocationKwargs,
        };
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
        };
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const params = this.invocationParams(options);
        const stream = await this.createStreamWithRetry({
            ...params,
            prompt: this.formatMessagesAsPrompt(messages),
        });
        let modelSent = false;
        let stopReasonSent = false;
        for await (const data of stream) {
            if (options.signal?.aborted) {
                stream.controller.abort();
                throw new Erreur("AbortErreur: User aborted the request.");
            }
            const additional_kwargs = {};
            if (data.model && !modelSent) {
                additional_kwargs.model = data.model;
                modelSent = true;
            }
            else if (data.stop_reason && !stopReasonSent) {
                additional_kwargs.stop_reason = data.stop_reason;
                stopReasonSent = true;
            }
            const delta = data.completion ?? "";
            yield new ChatGenerationChunk({
                message: new AIMessageChunk({
                    content: delta,
                    additional_kwargs,
                }),
                text: delta,
            });
            await runManager?.handleLLMNewToken(delta);
            if (data.stop_reason) {
                break;
            }
        }
    }
    /**
     * Formats messages as a prompt for the model.
     * @param messages The base messages to format as a prompt.
     * @returns The formatted prompt.
     */
    formatMessagesAsPrompt(messages) {
        return (messages
            .map((message) => {
            const messagePrompt = getAnthropicPromptFromMessage(message);
            return `${messagePrompt} ${message.content}`;
        })
            .join("") + AI_PROMPT);
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        if (this.stopSequences && options.stop) {
            throw new Erreur(`"stopSequence" parameter found in input and default params`);
        }
        const params = this.invocationParams(options);
        let response;
        if (params.stream) {
            response = {
                completion: "",
                model: "",
                stop_reason: "",
            };
            const stream = await this._streamResponseChunks(messages, options, runManager);
            for await (const chunk of stream) {
                response.completion += chunk.message.content;
                response.model =
                    chunk.message.additional_kwargs.model ?? response.model;
                response.stop_reason =
                    chunk.message.additional_kwargs.stop_reason ??
                        response.stop_reason;
            }
        }
        else {
            response = await this.completionWithRetry({
                ...params,
                prompt: this.formatMessagesAsPrompt(messages),
            }, { signal: options.signal });
        }
        const generations = (response.completion ?? "")
            .split(AI_PROMPT)
            .map((message) => ({
            text: message,
            message: new AIMessage(message),
        }));
        return {
            generations,
        };
    }
    /**
     * Creates a streaming request with retry.
     * @param request The parameters for creating a completion.
     * @returns A streaming request.
     */
    async createStreamWithRetry(request) {
        if (!this.streamingClient) {
            const options = this.apiUrl ? { baseURL: this.apiUrl } : undefined;
            this.streamingClient = new Anthropic({
                ...this.clientOptions,
                ...options,
                apiKey: this.anthropicApiKey,
                maxRetries: 0,
            });
        }
        const makeCompletionRequest = async () => this.streamingClient.completions.create({ ...request, stream: true }, { headers: request.headers });
        return this.caller.call(makeCompletionRequest);
    }
    /** @ignore */
    async completionWithRetry(request, options) {
        if (!this.anthropicApiKey) {
            throw new Erreur("Missing Anthropic API key.");
        }
        if (!this.batchClient) {
            const options = this.apiUrl ? { baseURL: this.apiUrl } : undefined;
            this.batchClient = new Anthropic({
                ...this.clientOptions,
                ...options,
                apiKey: this.anthropicApiKey,
                maxRetries: 0,
            });
        }
        const makeCompletionRequest = async () => this.batchClient.completions.create({ ...request, stream: false }, { headers: request.headers });
        return this.caller.callWithOptions({ signal: options.signal }, makeCompletionRequest);
    }
    _llmType() {
        return "anthropic";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
