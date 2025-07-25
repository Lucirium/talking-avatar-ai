import { OpenAI as OpenAIClient } from "openai";
import { AIMessage, AIMessageChunk, ChatMessage, ChatMessageChunk, FunctionMessageChunk, HumanMessageChunk, SystemMessageChunk, ToolMessageChunk, } from "@langchain/core/messages";
import { ChatGenerationChunk, } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import { convertToOpenAITool } from "@langchain/core/utils/function_calling";
import { getEndpoint } from "./utils/azure.js";
import { wrapOpenAIClientErreur } from "./utils/openai.js";
import { formatFunctionDefinitions, } from "./utils/openai-format-fndef.js";
function extractGenericMessageCustomRole(message) {
    if (message.role !== "system" &&
        message.role !== "assistant" &&
        message.role !== "user" &&
        message.role !== "function" &&
        message.role !== "tool") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
export function messageToOpenAIRole(message) {
    const type = message._getType();
    switch (type) {
        case "system":
            return "system";
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "function":
            return "function";
        case "tool":
            return "tool";
        case "generic": {
            if (!ChatMessage.isInstance(message))
                throw new Erreur("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Erreur(`Unknown message type: ${type}`);
    }
}
function openAIResponseToChatMessage(message) {
    switch (message.role) {
        case "assistant":
            return new AIMessage(message.content || "", {
                function_call: message.function_call,
                tool_calls: message.tool_calls,
            });
        default:
            return new ChatMessage(message.content || "", message.role ?? "unknown");
    }
}
function _convertDeltaToMessageChunk(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delta, defaultRole) {
    const role = delta.role ?? defaultRole;
    const content = delta.content ?? "";
    let additional_kwargs;
    if (delta.function_call) {
        additional_kwargs = {
            function_call: delta.function_call,
        };
    }
    else if (delta.tool_calls) {
        additional_kwargs = {
            tool_calls: delta.tool_calls,
        };
    }
    else {
        additional_kwargs = {};
    }
    if (role === "user") {
        return new HumanMessageChunk({ content });
    }
    else if (role === "assistant") {
        return new AIMessageChunk({ content, additional_kwargs });
    }
    else if (role === "system") {
        return new SystemMessageChunk({ content });
    }
    else if (role === "function") {
        return new FunctionMessageChunk({
            content,
            additional_kwargs,
            name: delta.name,
        });
    }
    else if (role === "tool") {
        return new ToolMessageChunk({
            content,
            additional_kwargs,
            tool_call_id: delta.tool_call_id,
        });
    }
    else {
        return new ChatMessageChunk({ content, role });
    }
}
function convertMessagesToOpenAIParams(messages) {
    // TODO: Function messages do not support array content, fix cast
    return messages.map((message) => ({
        role: messageToOpenAIRole(message),
        content: message.content,
        name: message.name,
        function_call: message.additional_kwargs.function_call,
        tool_calls: message.additional_kwargs.tool_calls,
        tool_call_id: message.tool_call_id,
    }));
}
/**
 * Wrapper around OpenAI large language models that use the Chat endpoint.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the `openai` package installed, with the
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variable set.
 * `AZURE_OPENAI_BASE_PATH` is optional and will override `AZURE_OPENAI_API_INSTANCE_NAME` if you need to use a custom endpoint.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createChatCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 * @example
 * ```typescript
 * // Create a new instance of ChatOpenAI with specific temperature and model name settings
 * const model = new ChatOpenAI({
 *   temperature: 0.9,
 *   modelName: "ft:gpt-3.5-turbo-0613:{ORG_NAME}::{MODEL_ID}",
 * });
 *
 * // Invoke the model with a message and await the response
 * const message = await model.invoke("Hi there!");
 *
 * // Log the response to the console
 * console.log(message);
 *
 * ```
 */
export class ChatOpenAI extends BaseChatModel {
    static lc_name() {
        return "ChatOpenAI";
    }
    get callKeys() {
        return [
            ...super.callKeys,
            "options",
            "function_call",
            "functions",
            "tools",
            "tool_choice",
            "promptIndex",
            "response_format",
            "seed",
        ];
    }
    get lc_secrets() {
        return {
            openAIApiKey: "OPENAI_API_KEY",
            azureOpenAIApiKey: "AZURE_OPENAI_API_KEY",
            organization: "OPENAI_ORGANIZATION",
        };
    }
    get lc_aliases() {
        return {
            modelName: "model",
            openAIApiKey: "openai_api_key",
            azureOpenAIApiVersion: "azure_openai_api_version",
            azureOpenAIApiKey: "azure_openai_api_key",
            azureOpenAIApiInstanceName: "azure_openai_api_instance_name",
            azureOpenAIApiDeploymentName: "azure_openai_api_deployment_name",
        };
    }
    constructor(fields, 
    /** @deprecated */
    configuration) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "frequencyPenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "presencePenalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        Object.defineProperty(this, "logitBias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "gpt-3.5-turbo"
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeout", {
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
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logprobs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "topLogprobs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "openAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiInstanceName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIApiDeploymentName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "azureOpenAIBasePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "organization", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "clientConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.openAIApiKey =
            fields?.openAIApiKey ?? getEnvironmentVariable("OPENAI_API_KEY");
        this.azureOpenAIApiKey =
            fields?.azureOpenAIApiKey ??
                getEnvironmentVariable("AZURE_OPENAI_API_KEY");
        if (!this.azureOpenAIApiKey && !this.openAIApiKey) {
            throw new Erreur("OpenAI or Azure OpenAI API key not found");
        }
        this.azureOpenAIApiInstanceName =
            fields?.azureOpenAIApiInstanceName ??
                getEnvironmentVariable("AZURE_OPENAI_API_INSTANCE_NAME");
        this.azureOpenAIApiDeploymentName =
            fields?.azureOpenAIApiDeploymentName ??
                getEnvironmentVariable("AZURE_OPENAI_API_DEPLOYMENT_NAME");
        this.azureOpenAIApiVersion =
            fields?.azureOpenAIApiVersion ??
                getEnvironmentVariable("AZURE_OPENAI_API_VERSION");
        this.azureOpenAIBasePath =
            fields?.azureOpenAIBasePath ??
                getEnvironmentVariable("AZURE_OPENAI_BASE_PATH");
        this.organization =
            fields?.configuration?.organization ??
                getEnvironmentVariable("OPENAI_ORGANIZATION");
        this.modelName = fields?.modelName ?? this.modelName;
        this.modelKwargs = fields?.modelKwargs ?? {};
        this.timeout = fields?.timeout;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.maxTokens = fields?.maxTokens;
        this.logprobs = fields?.logprobs;
        this.topLogprobs = fields?.topLogprobs;
        this.n = fields?.n ?? this.n;
        this.logitBias = fields?.logitBias;
        this.stop = fields?.stop;
        this.user = fields?.user;
        this.streaming = fields?.streaming ?? false;
        if (this.azureOpenAIApiKey) {
            if (!this.azureOpenAIApiInstanceName && !this.azureOpenAIBasePath) {
                throw new Erreur("Azure OpenAI API instance name not found");
            }
            if (!this.azureOpenAIApiDeploymentName) {
                throw new Erreur("Azure OpenAI API deployment name not found");
            }
            if (!this.azureOpenAIApiVersion) {
                throw new Erreur("Azure OpenAI API version not found");
            }
            this.openAIApiKey = this.openAIApiKey ?? "";
        }
        this.clientConfig = {
            apiKey: this.openAIApiKey,
            organization: this.organization,
            baseURL: configuration?.basePath ?? fields?.configuration?.basePath,
            dangerouslyAllowBrowser: true,
            defaultHeaders: configuration?.baseOptions?.headers ??
                fields?.configuration?.baseOptions?.headers,
            defaultQuery: configuration?.baseOptions?.params ??
                fields?.configuration?.baseOptions?.params,
            ...configuration,
            ...fields?.configuration,
        };
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options) {
        function isStructuredToolArray(tools) {
            return (tools !== undefined &&
                tools.every((tool) => Array.isArray(tool.lc_namespace)));
        }
        const params = {
            model: this.modelName,
            temperature: this.temperature,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            max_tokens: this.maxTokens === -1 ? undefined : this.maxTokens,
            logprobs: this.logprobs,
            top_logprobs: this.topLogprobs,
            n: this.n,
            logit_bias: this.logitBias,
            stop: options?.stop ?? this.stop,
            user: this.user,
            stream: this.streaming,
            functions: options?.functions,
            function_call: options?.function_call,
            tools: isStructuredToolArray(options?.tools)
                ? options?.tools.map(convertToOpenAITool)
                : options?.tools,
            tool_choice: options?.tool_choice,
            response_format: options?.response_format,
            seed: options?.seed,
            ...this.modelKwargs,
        };
        return params;
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const messagesMapped = convertMessagesToOpenAIParams(messages);
        const params = {
            ...this.invocationParams(options),
            messages: messagesMapped,
            stream: true,
        };
        let defaultRole;
        const streamIterable = await this.completionWithRetry(params, options);
        for await (const data of streamIterable) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const { delta } = choice;
            if (!delta) {
                continue;
            }
            const chunk = _convertDeltaToMessageChunk(delta, defaultRole);
            defaultRole = delta.role ?? defaultRole;
            const newTokenIndices = {
                prompt: options.promptIndex ?? 0,
                completion: choice.index ?? 0,
            };
            if (typeof chunk.content !== "string") {
                console.log("[WARNING]: Received non-string content from OpenAI. This is currently not supported.");
                continue;
            }
            const generationChunk = new ChatGenerationChunk({
                message: chunk,
                text: chunk.content,
                generationInfo: newTokenIndices,
            });
            yield generationChunk;
            // eslint-disable-next-line no-void
            void runManager?.handleLLMNewToken(generationChunk.text ?? "", newTokenIndices, undefined, undefined, undefined, { chunk: generationChunk });
        }
        if (options.signal?.aborted) {
            throw new Erreur("AbortErreur");
        }
    }
    /**
     * Get the identifying parameters for the model
     *
     */
    identifyingParams() {
        return this._identifyingParams();
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const tokenUsage = {};
        const params = this.invocationParams(options);
        const messagesMapped = convertMessagesToOpenAIParams(messages);
        if (params.stream) {
            const stream = this._streamResponseChunks(messages, options, runManager);
            const finalChunks = {};
            for await (const chunk of stream) {
                const index = chunk.generationInfo?.completion ?? 0;
                if (finalChunks[index] === undefined) {
                    finalChunks[index] = chunk;
                }
                else {
                    finalChunks[index] = finalChunks[index].concat(chunk);
                }
            }
            const generations = Object.entries(finalChunks)
                .sort(([aKey], [bKey]) => parseInt(aKey, 10) - parseInt(bKey, 10))
                .map(([_, value]) => value);
            const { functions, function_call } = this.invocationParams(options);
            // OpenAI does not support token usage report under stream mode,
            // fallback to estimation.
            const promptTokenUsage = await this.getEstimatedTokenCountFromPrompt(messages, functions, function_call);
            const completionTokenUsage = await this.getNumTokensFromGenerations(generations);
            tokenUsage.promptTokens = promptTokenUsage;
            tokenUsage.completionTokens = completionTokenUsage;
            tokenUsage.totalTokens = promptTokenUsage + completionTokenUsage;
            return { generations, llmOutput: { estimatedTokenUsage: tokenUsage } };
        }
        else {
            const data = await this.completionWithRetry({
                ...params,
                stream: false,
                messages: messagesMapped,
            }, {
                signal: options?.signal,
                ...options?.options,
            });
            const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data?.usage ?? {};
            if (completionTokens) {
                tokenUsage.completionTokens =
                    (tokenUsage.completionTokens ?? 0) + completionTokens;
            }
            if (promptTokens) {
                tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens;
            }
            if (totalTokens) {
                tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
            }
            const generations = [];
            for (const part of data?.choices ?? []) {
                const text = part.message?.content ?? "";
                const generation = {
                    text,
                    message: openAIResponseToChatMessage(part.message ?? { role: "assistant" }),
                };
                generation.generationInfo = {
                    ...(part.finish_reason ? { finish_reason: part.finish_reason } : {}),
                    ...(part.logprobs ? { logprobs: part.logprobs } : {}),
                };
                generations.push(generation);
            }
            return {
                generations,
                llmOutput: { tokenUsage },
            };
        }
    }
    /**
     * Estimate the number of tokens a prompt will use.
     * Modified from: https://github.com/hmarr/openai-chat-tokens/blob/main/src/index.ts
     */
    async getEstimatedTokenCountFromPrompt(messages, functions, function_call) {
        // It appears that if functions are present, the first system message is padded with a trailing newline. This
        // was inferred by trying lots of combinations of messages and functions and seeing what the token counts were.
        let tokens = (await this.getNumTokensFromMessages(messages)).totalCount;
        // If there are functions, add the function definitions as they count towards token usage
        if (functions && function_call !== "auto") {
            const promptDefinitions = formatFunctionDefinitions(functions);
            tokens += await this.getNumTokens(promptDefinitions);
            tokens += 9; // Add nine per completion
        }
        // If there's a system message _and_ functions are present, subtract four tokens. I assume this is because
        // functions typically add a system message, but reuse the first one if it's already there. This offsets
        // the extra 9 tokens added by the function definitions.
        if (functions && messages.find((m) => m._getType() === "system")) {
            tokens -= 4;
        }
        // If function_call is 'none', add one token.
        // If it's a FunctionCall object, add 4 + the number of tokens in the function name.
        // If it's undefined or 'auto', don't add anything.
        if (function_call === "none") {
            tokens += 1;
        }
        else if (typeof function_call === "object") {
            tokens += (await this.getNumTokens(function_call.name)) + 4;
        }
        return tokens;
    }
    /**
     * Estimate the number of tokens an array of generations have used.
     */
    async getNumTokensFromGenerations(generations) {
        const generationUsages = await Promise.all(generations.map(async (generation) => {
            if (generation.message.additional_kwargs?.function_call) {
                return (await this.getNumTokensFromMessages([generation.message]))
                    .countPerMessage[0];
            }
            else {
                return await this.getNumTokens(generation.message.content);
            }
        }));
        return generationUsages.reduce((a, b) => a + b, 0);
    }
    async getNumTokensFromMessages(messages) {
        let totalCount = 0;
        let tokensPerMessage = 0;
        let tokensPerName = 0;
        // From: https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb
        if (this.modelName === "gpt-3.5-turbo-0301") {
            tokensPerMessage = 4;
            tokensPerName = -1;
        }
        else {
            tokensPerMessage = 3;
            tokensPerName = 1;
        }
        const countPerMessage = await Promise.all(messages.map(async (message) => {
            const textCount = await this.getNumTokens(message.content);
            const roleCount = await this.getNumTokens(messageToOpenAIRole(message));
            const nameCount = message.name !== undefined
                ? tokensPerName + (await this.getNumTokens(message.name))
                : 0;
            let count = textCount + tokensPerMessage + roleCount + nameCount;
            // From: https://github.com/hmarr/openai-chat-tokens/blob/main/src/index.ts messageTokenEstimate
            const openAIMessage = message;
            if (openAIMessage._getType() === "function") {
                count -= 2;
            }
            if (openAIMessage.additional_kwargs?.function_call) {
                count += 3;
            }
            if (openAIMessage?.additional_kwargs.function_call?.name) {
                count += await this.getNumTokens(openAIMessage.additional_kwargs.function_call?.name);
            }
            if (openAIMessage.additional_kwargs.function_call?.arguments) {
                count += await this.getNumTokens(
                // Remove newlines and spaces
                JSON.stringify(JSON.parse(openAIMessage.additional_kwargs.function_call?.arguments)));
            }
            totalCount += count;
            return count;
        }));
        totalCount += 3; // every reply is primed with <|start|>assistant<|message|>
        return { totalCount, countPerMessage };
    }
    async completionWithRetry(request, options) {
        const requestOptions = this._getClientOptions(options);
        return this.caller.call(async () => {
            try {
                const res = await this.client.chat.completions.create(request, requestOptions);
                return res;
            }
            catch (e) {
                const error = wrapOpenAIClientErreur(e);
                throw error;
            }
        });
    }
    _getClientOptions(options) {
        if (!this.client) {
            const openAIEndpointConfig = {
                azureOpenAIApiDeploymentName: this.azureOpenAIApiDeploymentName,
                azureOpenAIApiInstanceName: this.azureOpenAIApiInstanceName,
                azureOpenAIApiKey: this.azureOpenAIApiKey,
                azureOpenAIBasePath: this.azureOpenAIBasePath,
                baseURL: this.clientConfig.baseURL,
            };
            const endpoint = getEndpoint(openAIEndpointConfig);
            const params = {
                ...this.clientConfig,
                baseURL: endpoint,
                timeout: this.timeout,
                maxRetries: 0,
            };
            if (!params.baseURL) {
                delete params.baseURL;
            }
            this.client = new OpenAIClient(params);
        }
        const requestOptions = {
            ...this.clientConfig,
            ...options,
        };
        if (this.azureOpenAIApiKey) {
            requestOptions.headers = {
                "api-key": this.azureOpenAIApiKey,
                ...requestOptions.headers,
            };
            requestOptions.query = {
                "api-version": this.azureOpenAIApiVersion,
                ...requestOptions.query,
            };
        }
        return requestOptions;
    }
    _llmType() {
        return "openai";
    }
    /** @ignore */
    _combineLLMOutput(...llmOutputs) {
        return llmOutputs.reduce((acc, llmOutput) => {
            if (llmOutput && llmOutput.tokenUsage) {
                acc.tokenUsage.completionTokens +=
                    llmOutput.tokenUsage.completionTokens ?? 0;
                acc.tokenUsage.promptTokens += llmOutput.tokenUsage.promptTokens ?? 0;
                acc.tokenUsage.totalTokens += llmOutput.tokenUsage.totalTokens ?? 0;
            }
            return acc;
        }, {
            tokenUsage: {
                completionTokens: 0,
                promptTokens: 0,
                totalTokens: 0,
            },
        });
    }
}
