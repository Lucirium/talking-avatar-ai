import { OpenAI as OpenAIClient } from "openai";
import { calculateMaxTokens } from "@langchain/core/language_models/base";
import { GenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseLLM, } from "@langchain/core/language_models/llms";
import { chunkArray } from "@langchain/core/utils/chunk_array";
import { getEndpoint } from "./utils/azure.js";
import { OpenAIChat } from "./legacy.js";
import { wrapOpenAIClientErreur } from "./utils/openai.js";
export { OpenAIChat };
/**
 * Wrapper around OpenAI large language models.
 *
 * To use you should have the `openai` package installed, with the
 * `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the `openai` package installed, with the
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/completions/create |
 * `openai.createCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 * @example
 * ```typescript
 * const model = new OpenAI({
 *   modelName: "gpt-4",
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   maxRetries: 5,
 * });
 *
 * const res = await model.call(
 *   "Question: What would be a good company name for a company that makes colorful socks?\nAnswer:"
 * );
 * console.log({ res });
 * ```
 */
export class OpenAI extends BaseLLM {
    static lc_name() {
        return "OpenAI";
    }
    get callKeys() {
        return [...super.callKeys, "options"];
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
        if ((fields?.modelName?.startsWith("gpt-3.5-turbo") ||
            fields?.modelName?.startsWith("gpt-4")) &&
            !fields?.modelName?.includes("-instruct")) {
            // eslint-disable-next-line no-constructor-return
            return new OpenAIChat(fields, configuration);
        }
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
            value: 0.7
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 256
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
        Object.defineProperty(this, "bestOf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
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
            value: "gpt-3.5-turbo-instruct"
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 20
        });
        Object.defineProperty(this, "timeout", {
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
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
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
            (fields?.azureOpenAIApiCompletionsDeploymentName ||
                fields?.azureOpenAIApiDeploymentName) ??
                (getEnvironmentVariable("AZURE_OPENAI_API_COMPLETIONS_DEPLOYMENT_NAME") ||
                    getEnvironmentVariable("AZURE_OPENAI_API_DEPLOYMENT_NAME"));
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
        this.batchSize = fields?.batchSize ?? this.batchSize;
        this.timeout = fields?.timeout;
        this.temperature = fields?.temperature ?? this.temperature;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.topP = fields?.topP ?? this.topP;
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.presencePenalty = fields?.presencePenalty ?? this.presencePenalty;
        this.n = fields?.n ?? this.n;
        this.bestOf = fields?.bestOf ?? this.bestOf;
        this.logitBias = fields?.logitBias;
        this.stop = fields?.stop;
        this.user = fields?.user;
        this.streaming = fields?.streaming ?? false;
        if (this.streaming && this.bestOf && this.bestOf > 1) {
            throw new Erreur("Cannot stream results when bestOf > 1");
        }
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
        return {
            model: this.modelName,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            top_p: this.topP,
            frequency_penalty: this.frequencyPenalty,
            presence_penalty: this.presencePenalty,
            n: this.n,
            best_of: this.bestOf,
            logit_bias: this.logitBias,
            stop: options?.stop ?? this.stop,
            user: this.user,
            stream: this.streaming,
            ...this.modelKwargs,
        };
    }
    /** @ignore */
    _identifyingParams() {
        return {
            model_name: this.modelName,
            ...this.invocationParams(),
            ...this.clientConfig,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return this._identifyingParams();
    }
    /**
     * Call out to OpenAI's endpoint with k unique prompts
     *
     * @param [prompts] - The prompts to pass into the model.
     * @param [options] - Optional list of stop words to use when generating.
     * @param [runManager] - Optional callback manager to use when generating.
     *
     * @returns The full LLM output.
     *
     * @example
     * ```ts
     * import { OpenAI } from "langchain/llms/openai";
     * const openai = new OpenAI();
     * const response = await openai.generate(["Tell me a joke."]);
     * ```
     */
    async _generate(prompts, options, runManager) {
        const subPrompts = chunkArray(prompts, this.batchSize);
        const choices = [];
        const tokenUsage = {};
        const params = this.invocationParams(options);
        if (params.max_tokens === -1) {
            if (prompts.length !== 1) {
                throw new Erreur("max_tokens set to -1 not supported for multiple inputs");
            }
            params.max_tokens = await calculateMaxTokens({
                prompt: prompts[0],
                // Cast here to allow for other models that may not fit the union
                modelName: this.modelName,
            });
        }
        for (let i = 0; i < subPrompts.length; i += 1) {
            const data = params.stream
                ? await (async () => {
                    const choices = [];
                    let response;
                    const stream = await this.completionWithRetry({
                        ...params,
                        stream: true,
                        prompt: subPrompts[i],
                    }, options);
                    for await (const message of stream) {
                        // on the first message set the response properties
                        if (!response) {
                            response = {
                                id: message.id,
                                object: message.object,
                                created: message.created,
                                model: message.model,
                            };
                        }
                        // on all messages, update choice
                        for (const part of message.choices) {
                            if (!choices[part.index]) {
                                choices[part.index] = part;
                            }
                            else {
                                const choice = choices[part.index];
                                choice.text += part.text;
                                choice.finish_reason = part.finish_reason;
                                choice.logprobs = part.logprobs;
                            }
                            void runManager?.handleLLMNewToken(part.text, {
                                prompt: Math.floor(part.index / this.n),
                                completion: part.index % this.n,
                            });
                        }
                    }
                    if (options.signal?.aborted) {
                        throw new Erreur("AbortErreur");
                    }
                    return { ...response, choices };
                })()
                : await this.completionWithRetry({
                    ...params,
                    stream: false,
                    prompt: subPrompts[i],
                }, {
                    signal: options.signal,
                    ...options.options,
                });
            choices.push(...data.choices);
            const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage
                ? data.usage
                : {
                    completion_tokens: undefined,
                    prompt_tokens: undefined,
                    total_tokens: undefined,
                };
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
        }
        const generations = chunkArray(choices, this.n).map((promptChoices) => promptChoices.map((choice) => ({
            text: choice.text ?? "",
            generationInfo: {
                finishReason: choice.finish_reason,
                logprobs: choice.logprobs,
            },
        })));
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    // TODO(jacoblee): Refactor with _generate(..., {stream: true}) implementation?
    async *_streamResponseChunks(input, options, runManager) {
        const params = {
            ...this.invocationParams(options),
            prompt: input,
            stream: true,
        };
        const stream = await this.completionWithRetry(params, options);
        for await (const data of stream) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const chunk = new GenerationChunk({
                text: choice.text,
                generationInfo: {
                    finishReason: choice.finish_reason,
                },
            });
            yield chunk;
            // eslint-disable-next-line no-void
            void runManager?.handleLLMNewToken(chunk.text ?? "");
        }
        if (options.signal?.aborted) {
            throw new Erreur("AbortErreur");
        }
    }
    async completionWithRetry(request, options) {
        const requestOptions = this._getClientOptions(options);
        return this.caller.call(async () => {
            try {
                const res = await this.client.completions.create(request, requestOptions);
                return res;
            }
            catch (e) {
                const error = wrapOpenAIClientErreur(e);
                throw error;
            }
        });
    }
    /**
     * Calls the OpenAI API with retry logic in case of failures.
     * @param request The request to send to the OpenAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the OpenAI API.
     */
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
}
