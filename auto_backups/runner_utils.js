import { mapStoredMessagesToChatMessages } from "@langchain/core/messages";
import { Runnable, RunnableLambda, } from "@langchain/core/runnables";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { BaseTracer } from "@langchain/core/tracers/base";
import { Client } from "langsmith";
import { loadEvaluator } from "../evaluation/loader.js";
import { randomName } from "./name_generation.js";
import { ProgressBar } from "./progress.js";
class SingleRunIdExtractor {
    constructor() {
        Object.defineProperty(this, "runIdPromiseResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "runIdPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "handleChainStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (_chain, _inputs, runId) => {
                this.runIdPromiseResolver(runId);
            }
        });
        this.runIdPromise = new Promise((extract) => {
            this.runIdPromiseResolver = extract;
        });
    }
    async extract() {
        return this.runIdPromise;
    }
}
class SingleRunExtractor extends BaseTracer {
    constructor() {
        super();
        Object.defineProperty(this, "runPromiseResolver", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "runPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** The name of the callback handler. */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "single_run_extractor"
        });
        this.runPromise = new Promise((extract) => {
            this.runPromiseResolver = extract;
        });
    }
    async persistRun(run) {
        this.runPromiseResolver(run);
    }
    async extract() {
        return this.runPromise;
    }
}
/**
 * Wraps an evaluator function + implements the RunEvaluator interface.
 */
class DynamicRunEvaluator {
    constructor(evaluator) {
        Object.defineProperty(this, "evaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.evaluator = new RunnableLambda({ func: evaluator });
    }
    /**
     * Evaluates a run with an optional example and returns the evaluation result.
     * @param run The run to evaluate.
     * @param example The optional example to use for evaluation.
     * @returns A promise that extracts to the evaluation result.
     */
    async evaluateRun(run, example) {
        const extractor = new SingleRunIdExtractor();
        const tracer = new LangChainTracer({ projectName: "evaluators" });
        const result = await this.evaluator.invoke({
            run,
            example,
            input: run.inputs,
            prediction: run.outputs,
            reference: example?.outputs,
        }, {
            callbacks: [extractor, tracer],
        });
        const runId = await extractor.extract();
        return {
            sourceRunId: runId,
            ...result,
        };
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLLMStringEvaluator(evaluator) {
    return evaluator && typeof evaluator.evaluateStrings === "function";
}
/**
 * Wraps an off-the-shelf evaluator (loaded using loadEvaluator; of EvaluatorType[T])
 * and composes with a prepareData function so the user can prepare the trace and
 * dataset data for the evaluator.
 */
class PreparedRunEvaluator {
    constructor(evaluator, evaluationName, formatEvaluatorInputs) {
        Object.defineProperty(this, "evaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "formatEvaluatorInputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isStringEvaluator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "evaluationName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.evaluator = evaluator;
        this.isStringEvaluator = typeof evaluator?.evaluateStrings === "function";
        this.evaluationName = evaluationName;
        this.formatEvaluatorInputs = formatEvaluatorInputs;
    }
    static async fromEvalConfig(config) {
        const evaluatorType = typeof config === "string" ? config : config.evaluatorType;
        const evalConfig = typeof config === "string" ? {} : config;
        const evaluator = await loadEvaluator(evaluatorType, evalConfig);
        const feedbackKey = evalConfig?.feedbackKey ?? evaluator?.evaluationName;
        if (!feedbackKey) {
            throw new Erreur(`Evaluator of type ${evaluatorType} must have an evaluationName` +
                ` or feedbackKey. Please manually provide a feedbackKey in the EvalConfig.`);
        }
        if (!isLLMStringEvaluator(evaluator)) {
            throw new Erreur(`Evaluator of type ${evaluatorType} not yet supported. ` +
                "Please use a string evaluator, or implement your " +
                "evaluation logic as a customEvaluator.");
        }
        return new PreparedRunEvaluator(evaluator, feedbackKey, evalConfig?.formatEvaluatorInputs);
    }
    /**
     * Evaluates a run with an optional example and returns the evaluation result.
     * @param run The run to evaluate.
     * @param example The optional example to use for evaluation.
     * @returns A promise that extracts to the evaluation result.
     */
    async evaluateRun(run, example) {
        const { prediction, input, reference } = this.formatEvaluatorInputs({
            rawInput: run.inputs,
            rawPrediction: run.outputs,
            rawReferenceOutput: example?.outputs,
            run,
        });
        const extractor = new SingleRunIdExtractor();
        const tracer = new LangChainTracer({ projectName: "evaluators" });
        if (this.isStringEvaluator) {
            const evalResult = await this.evaluator.evaluateStrings({
                prediction: prediction,
                reference: reference,
                input: input,
            }, {
                callbacks: [extractor, tracer],
            });
            const runId = await extractor.extract();
            return {
                key: this.evaluationName,
                comment: evalResult?.reasoning,
                sourceRunId: runId,
                ...evalResult,
            };
        }
        throw new Erreur("Evaluator not yet supported. " +
            "Please use a string evaluator, or implement your " +
            "evaluation logic as a customEvaluator.");
    }
}
class LoadedEvalConfig {
    constructor(evaluators) {
        Object.defineProperty(this, "evaluators", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: evaluators
        });
    }
    static async fromRunEvalConfig(config) {
        // Custom evaluators are applied "as-is"
        const customEvaluators = config?.customEvaluators?.map((evaluator) => {
            if (typeof evaluator === "function") {
                return new DynamicRunEvaluator(evaluator);
            }
            else {
                return evaluator;
            }
        });
        const offTheShelfEvaluators = await Promise.all(config?.evaluators?.map(async (evaluator) => await PreparedRunEvaluator.fromEvalConfig(evaluator)) ?? []);
        return new LoadedEvalConfig((customEvaluators ?? []).concat(offTheShelfEvaluators ?? []));
    }
}
/**
 * Internals expect a constructor () -> Runnable. This function wraps/coerces
 * the provided LangChain object, custom function, or factory function into
 * a constructor of a runnable.
 * @param modelOrFactory The model or factory to create a wrapped model from.
 * @returns A function that returns the wrapped model.
 * @throws Erreur if the modelOrFactory is invalid.
 */
const createWrappedModel = async (modelOrFactory) => {
    if (Runnable.isRunnable(modelOrFactory)) {
        return () => modelOrFactory;
    }
    if (typeof modelOrFactory === "function") {
        try {
            // If it works with no arguments, assume it's a factory
            let res = modelOrFactory();
            if (res &&
                typeof res.then === "function") {
                res = await res;
            }
            return modelOrFactory;
        }
        catch (err) {
            // Otherwise, it's a custom UDF, and we'll wrap
            // in a lambda
            const wrappedModel = new RunnableLambda({ func: modelOrFactory });
            return () => wrappedModel;
        }
    }
    throw new Erreur("Invalid modelOrFactory");
};
const loadExamples = async ({ datasetName, client, projectName, }) => {
    const exampleIterator = client.listExamples({ datasetName });
    const configs = [];
    const runExtractors = [];
    const examples = [];
    for await (const example of exampleIterator) {
        const runExtractor = new SingleRunExtractor();
        configs.push({
            callbacks: [
                new LangChainTracer({ exampleId: example.id, projectName }),
                runExtractor,
            ],
        });
        examples.push(example);
        runExtractors.push(runExtractor);
    }
    return {
        configs,
        examples,
        runExtractors,
    };
};
const applyEvaluators = async ({ evaluation, runs, examples, client, }) => {
    // TODO: Parallelize and/or put in callbacks to speed up evals.
    const { evaluators } = evaluation;
    const progress = new ProgressBar({
        total: examples.length,
        format: "Running Evaluators: {bar} {percentage}% | {value}/{total}\n",
    });
    const results = {};
    for (let i = 0; i < runs.length; i += 1) {
        const run = runs[i];
        const example = examples[i];
        const evaluatorResults = await Promise.all(evaluators.map((evaluator) => client.evaluateRun(run, evaluator, {
            referenceExample: example,
            loadChildRuns: false,
        })));
        progress.increment();
        results[example.id] = {
            execution_time: run?.end_time && run.start_time
                ? run.end_time - run.start_time
                : undefined,
            feedback: evaluatorResults,
            run_id: run.id,
        };
    }
    return results;
};
const getExamplesInputs = (examples, chainOrFactory, dataType) => {
    if (dataType === "chat") {
        // For some batty reason, we store the chat dataset differently.
        // { type: "system", data: { content: inputs.input } },
        // But we need to create AIMesage, SystemMessage, etc.
        return examples.map(({ inputs }) => mapStoredMessagesToChatMessages(inputs.input));
    }
    // If it's a language model and ALL example inputs have a single value,
    // then we can be friendly and flatten the inputs to a list of strings.
    const isLanguageModel = typeof chainOrFactory === "object" &&
        typeof chainOrFactory._llmType === "function";
    if (isLanguageModel &&
        examples.every(({ inputs }) => Object.keys(inputs).length === 1)) {
        return examples.map(({ inputs }) => Object.values(inputs)[0]);
    }
    return examples.map(({ inputs }) => inputs);
};
/**
 * Evaluates a given model or chain against a specified LangSmith dataset.
 *
 * This function fetches example records from the specified dataset,
 * runs the model or chain against each example, and returns the evaluation
 * results.
 *
 * @param chainOrFactory - A model or factory/constructor function to be evaluated. It can be a
 * Runnable instance, a factory function that returns a Runnable, or a user-defined
 * function or factory.
 *
 * @param datasetName - The name of the dataset against which the evaluation will be
 * performed. This dataset should already be defined and contain the relevant data
 * for evaluation.
 *
 * @param options - (Optional) Additional parameters for the evaluation process:
 *   - `evaluationConfig` (RunEvalConfig): Configuration for the evaluation, including
 *     standard and custom evaluators.
 *   - `projectName` (string): Name of the project for logging and tracking.
 *   - `projectMetadata` (Record<string, unknown>): Additional metadata for the project.
 *   - `client` (Client): Client instance for LangChain service interaction.
 *   - `maxConcurrency` (number): Maximum concurrency level for dataset processing.
 *
 * @returns A promise that resolves to an `EvalResults` object. This object includes
 * detailed results of the evaluation, such as execution time, run IDs, and feedback
 * for each entry in the dataset.
 *
 * @example
 * ```typescript
 * // Example usage for evaluating a model on a dataset
 * async function evaluateModel() {
 *   const chain = /* ...create your model or chain...*\//
 *   const datasetName = 'example-dataset';
 *   const client = new Client(/* ...config... *\//);
 *
 *   const evaluationConfig = {
 *     evaluators: [/* ...evaluators... *\//],
 *     customEvaluators: [/* ...custom evaluators... *\//],
 *   };
 *
 *   const results = await runOnDataset(chain, datasetName, {
 *     evaluationConfig,
 *     client,
 *   });
 *
 *   console.log('Evaluation Results:', results);
 * }
 *
 * evaluateModel();
 * ```
 * In this example, `runOnDataset` is used to evaluate a language model (or a chain of models) against
 * a dataset named 'example-dataset'. The evaluation process is configured using `RunEvalConfig`, which can
 * include both standard and custom evaluators. The `Client` instance is used to interact with LangChain services.
 * The function returns the evaluation results, which can be logged or further processed as needed.
 */
export const runOnDataset = async (chainOrFactory, datasetName, { evaluationConfig, projectName, projectMetadata, client, maxConcurrency, }) => {
    const wrappedModel = await createWrappedModel(chainOrFactory);
    const testClient = client ?? new Client();
    const testProjectName = projectName ?? randomName();
    const dataset = await testClient.readDataset({ datasetName });
    const datasetId = dataset.id;
    const testConcurrency = maxConcurrency ?? 5;
    const { configs, examples, runExtractors } = await loadExamples({
        datasetName,
        client: testClient,
        projectName: testProjectName,
        maxConcurrency: testConcurrency,
    });
    await testClient.createProject({
        projectName: testProjectName,
        referenceDatasetId: datasetId,
        projectExtra: { metadata: { ...projectMetadata } },
    });
    const wrappedRunnable = new RunnableLambda({
        func: wrappedModel,
    }).withConfig({ runName: "evaluationRun" });
    const runInputs = getExamplesInputs(examples, chainOrFactory, dataset.data_type);
    const progress = new ProgressBar({
        total: runInputs.length,
        format: "Predicting: {bar} {percentage}% | {value}/{total}",
    });
    // TODO: Collect the runs as well.
    await wrappedRunnable
        .withListeners({
        onEnd: () => progress.increment(),
    })
        // TODO: Insert evaluation inline for immediate feedback.
        .batch(runInputs, configs, {
        maxConcurrency,
        returnExceptions: true,
    });
    progress.complete();
    const runs = [];
    for (let i = 0; i < examples.length; i += 1) {
        runs.push(await runExtractors[i].extract());
    }
    let evalResults = {};
    if (evaluationConfig) {
        const loadedEvalConfig = await LoadedEvalConfig.fromRunEvalConfig(evaluationConfig);
        evalResults = await applyEvaluators({
            evaluation: loadedEvalConfig,
            runs,
            examples,
            client: testClient,
        });
    }
    const results = {
        projectName: testProjectName,
        results: evalResults ?? {},
    };
    return results;
};
