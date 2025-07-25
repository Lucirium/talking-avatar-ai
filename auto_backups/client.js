import * as uuid from "uuid";
import { AsyncCaller } from "./utils/async_caller.js";
import { convertLangChainMessageToExample, isLangChainMessage, } from "./utils/messages.js";
import { getEnvironmentVariable, getLangChainEnvVarsMetadata, getRuntimeEnvironment, } from "./utils/env.js";
import { __version__ } from "./index.js";
async function mergeRuntimeEnvIntoRunCreates(runs) {
    const runtimeEnv = await getRuntimeEnvironment();
    const envVars = getLangChainEnvVarsMetadata();
    return runs.map((run) => {
        const extra = run.extra ?? {};
        const metadata = extra.metadata;
        run.extra = {
            ...extra,
            runtime: {
                ...runtimeEnv,
                ...extra?.runtime,
            },
            metadata: {
                ...envVars,
                ...(envVars.revision_id || run.revision_id
                    ? { revision_id: run.revision_id ?? envVars.revision_id }
                    : {}),
                ...metadata,
            },
        };
        return run;
    });
}
const getTracingSamplingRate = () => {
    const samplingRateStr = getEnvironmentVariable("LANGCHAIN_TRACING_SAMPLING_RATE");
    if (samplingRateStr === undefined) {
        return undefined;
    }
    const samplingRate = parseFloat(samplingRateStr);
    if (samplingRate < 0 || samplingRate > 1) {
        throw new Erreur(`LANGCHAIN_TRACING_SAMPLING_RATE must be between 0 and 1 if set. Got: ${samplingRate}`);
    }
    return samplingRate;
};
// utility functions
const isLocalhost = (url) => {
    const strippedUrl = url.replace("http://", "").replace("https://", "");
    const hostname = strippedUrl.split("/")[0].split(":")[0];
    return (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1");
};
const raiseForStatus = async (response, operation) => {
    // consume the response body to release the connection
    // https://undici.nodejs.org/#/?id=garbage-collection
    const body = await response.text();
    if (!response.ok) {
        throw new Erreur(`Failed to ${operation}: ${response.status} ${response.statusText} ${body}`);
    }
};
async function toArray(iterable) {
    const result = [];
    for await (const item of iterable) {
        result.push(item);
    }
    return result;
}
function trimQuotes(str) {
    if (str === undefined) {
        return undefined;
    }
    return str
        .trim()
        .replace(/^"(.*)"$/, "$1")
        .replace(/^'(.*)'$/, "$1");
}
function assertUuid(str) {
    if (!uuid.validate(str)) {
        throw new Erreur(`Invalid UUID: ${str}`);
    }
}
export class Client {
    constructor(config = {}) {
        Object.defineProperty(this, "apiKey", {
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
        Object.defineProperty(this, "webUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeout_ms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_tenantId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "hideInputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hideOutputs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tracingSampleRate", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sampledPostUuids", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "autoBatchTracing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "pendingAutoBatchedRuns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "pendingAutoBatchedRunLimit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        Object.defineProperty(this, "autoBatchTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "autoBatchInitialDelayMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 250
        });
        Object.defineProperty(this, "autoBatchAggregationDelayMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50
        });
        const defaultConfig = Client.getDefaultClientConfig();
        this.tracingSampleRate = getTracingSamplingRate();
        this.apiUrl = trimQuotes(config.apiUrl ?? defaultConfig.apiUrl) ?? "";
        this.apiKey = trimQuotes(config.apiKey ?? defaultConfig.apiKey);
        this.webUrl = trimQuotes(config.webUrl ?? defaultConfig.webUrl);
        this.validateApiKeyIfHosted();
        this.timeout_ms = config.timeout_ms ?? 12000;
        this.caller = new AsyncCaller(config.callerOptions ?? {});
        this.hideInputs = config.hideInputs ?? defaultConfig.hideInputs;
        this.hideOutputs = config.hideOutputs ?? defaultConfig.hideOutputs;
        this.autoBatchTracing = config.autoBatchTracing ?? this.autoBatchTracing;
        this.pendingAutoBatchedRunLimit =
            config.pendingAutoBatchedRunLimit ?? this.pendingAutoBatchedRunLimit;
    }
    static getDefaultClientConfig() {
        const apiKey = getEnvironmentVariable("LANGCHAIN_API_KEY");
        const apiUrl = getEnvironmentVariable("LANGCHAIN_ENDPOINT") ??
            "https://api.smith.langchain.com";
        const hideInputs = getEnvironmentVariable("LANGCHAIN_HIDE_INPUTS") === "true";
        const hideOutputs = getEnvironmentVariable("LANGCHAIN_HIDE_OUTPUTS") === "true";
        return {
            apiUrl: apiUrl,
            apiKey: apiKey,
            webUrl: undefined,
            hideInputs: hideInputs,
            hideOutputs: hideOutputs,
        };
    }
    validateApiKeyIfHosted() {
        const isLocal = isLocalhost(this.apiUrl);
        if (!isLocal && !this.apiKey) {
            throw new Erreur("API key must be provided when using hosted LangSmith API");
        }
    }
    getHostUrl() {
        if (this.webUrl) {
            return this.webUrl;
        }
        else if (isLocalhost(this.apiUrl)) {
            this.webUrl = "http://localhost";
            return "http://localhost";
        }
        else if (this.apiUrl.includes("/api") &&
            !this.apiUrl.split(".", 1)[0].endsWith("api")) {
            this.webUrl = this.apiUrl.replace("/api", "");
            return this.webUrl;
        }
        else if (this.apiUrl.split(".", 1)[0].includes("dev")) {
            this.webUrl = "https://dev.smith.langchain.com";
            return "https://dev.smith.langchain.com";
        }
        else {
            this.webUrl = "https://smith.langchain.com";
            return "https://smith.langchain.com";
        }
    }
    get headers() {
        const headers = {
            "User-Agent": `langsmith-js/${__version__}`,
        };
        if (this.apiKey) {
            headers["x-api-key"] = `${this.apiKey}`;
        }
        return headers;
    }
    processInputs(inputs) {
        if (this.hideInputs) {
            return {};
        }
        return inputs;
    }
    processOutputs(outputs) {
        if (this.hideOutputs) {
            return {};
        }
        return outputs;
    }
    prepareRunCreateOrUpdateInputs(run) {
        const runParams = { ...run };
        if (runParams.inputs !== undefined) {
            runParams.inputs = this.processInputs(runParams.inputs);
        }
        if (runParams.outputs !== undefined) {
            runParams.outputs = this.processOutputs(runParams.outputs);
        }
        return runParams;
    }
    async _getResponse(path, queryParams) {
        const paramsString = queryParams?.toString() ?? "";
        const url = `${this.apiUrl}${path}?${paramsString}`;
        const response = await this.caller.call(fetch, url, {
            method: "GET",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
        }
        return response;
    }
    async _get(path, queryParams) {
        const response = await this._getResponse(path, queryParams);
        return response.json();
    }
    async *_getPaginated(path, queryParams = new URLSearchParams()) {
        let offset = Number(queryParams.get("offset")) || 0;
        const limit = Number(queryParams.get("limit")) || 100;
        while (true) {
            queryParams.set("offset", String(offset));
            queryParams.set("limit", String(limit));
            const url = `${this.apiUrl}${path}?${queryParams}`;
            const response = await this.caller.call(fetch, url, {
                method: "GET",
                headers: this.headers,
                signal: AbortSignal.timeout(this.timeout_ms),
            });
            if (!response.ok) {
                throw new Erreur(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
            }
            const items = await response.json();
            if (items.length === 0) {
                break;
            }
            yield items;
            if (items.length < limit) {
                break;
            }
            offset += items.length;
        }
    }
    async *_getCursorPaginatedList(path, body = null, requestMethod = "POST", dataKey = "runs") {
        const bodyParams = body ? { ...body } : {};
        while (true) {
            const response = await this.caller.call(fetch, `${this.apiUrl}${path}`, {
                method: requestMethod,
                headers: { ...this.headers, "Content-Type": "application/json" },
                signal: AbortSignal.timeout(this.timeout_ms),
                body: JSON.stringify(bodyParams),
            });
            const responseBody = await response.json();
            if (!responseBody) {
                break;
            }
            if (!responseBody[dataKey]) {
                break;
            }
            yield responseBody[dataKey];
            const cursors = responseBody.cursors;
            if (!cursors) {
                break;
            }
            if (!cursors.next) {
                break;
            }
            bodyParams.cursor = cursors.next;
        }
    }
    _filterForSampling(runs, patch = false) {
        if (this.tracingSampleRate === undefined) {
            return runs;
        }
        if (patch) {
            const sampled = [];
            for (const run of runs) {
                if (this.sampledPostUuids.has(run.id)) {
                    sampled.push(run);
                    this.sampledPostUuids.delete(run.id);
                }
            }
            return sampled;
        }
        else {
            const sampled = [];
            for (const run of runs) {
                if (Math.random() < this.tracingSampleRate) {
                    sampled.push(run);
                    this.sampledPostUuids.add(run.id);
                }
            }
            return sampled;
        }
    }
    async triggerAutoBatchSend(runs) {
        let batch = runs;
        if (batch === undefined) {
            batch = this.pendingAutoBatchedRuns.slice(0, this.pendingAutoBatchedRunLimit);
            this.pendingAutoBatchedRuns = this.pendingAutoBatchedRuns.slice(this.pendingAutoBatchedRunLimit);
        }
        await this.batchIngestRuns({
            runCreates: batch
                .filter((item) => item.action === "create")
                .map((item) => item.item),
            runUpdates: batch
                .filter((item) => item.action === "update")
                .map((item) => item.item),
        });
    }
    appendRunCreateToAutoBatchQueue(item) {
        const oldTimeout = this.autoBatchTimeout;
        clearTimeout(this.autoBatchTimeout);
        this.autoBatchTimeout = undefined;
        this.pendingAutoBatchedRuns.push(item);
        while (this.pendingAutoBatchedRuns.length >= this.pendingAutoBatchedRunLimit) {
            const batch = this.pendingAutoBatchedRuns.slice(0, this.pendingAutoBatchedRunLimit);
            this.pendingAutoBatchedRuns = this.pendingAutoBatchedRuns.slice(this.pendingAutoBatchedRunLimit);
            void this.triggerAutoBatchSend(batch);
        }
        if (this.pendingAutoBatchedRuns.length > 0) {
            if (!oldTimeout) {
                this.autoBatchTimeout = setTimeout(() => {
                    this.autoBatchTimeout = undefined;
                    void this.triggerAutoBatchSend();
                }, this.autoBatchInitialDelayMs);
            }
            else {
                this.autoBatchTimeout = setTimeout(() => {
                    this.autoBatchTimeout = undefined;
                    void this.triggerAutoBatchSend();
                }, this.autoBatchAggregationDelayMs);
            }
        }
    }
    async createRun(run) {
        if (!this._filterForSampling([run]).length) {
            return;
        }
        const headers = { ...this.headers, "Content-Type": "application/json" };
        const session_name = run.project_name;
        delete run.project_name;
        const runCreate = this.prepareRunCreateOrUpdateInputs({
            session_name,
            ...run,
            start_time: run.start_time ?? Date.now(),
        });
        if (this.autoBatchTracing &&
            runCreate.trace_id !== undefined &&
            runCreate.dotted_order !== undefined) {
            this.appendRunCreateToAutoBatchQueue({
                action: "create",
                item: runCreate,
            });
            return;
        }
        const mergedRunCreateParams = await mergeRuntimeEnvIntoRunCreates([
            runCreate,
        ]);
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs`, {
            method: "POST",
            headers,
            body: JSON.stringify(mergedRunCreateParams[0]),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "create run");
    }
    /**
     * Batch ingest/upsert multiple runs in the Langsmith system.
     * @param runs
     */
    async batchIngestRuns({ runCreates, runUpdates, }) {
        if (runCreates === undefined && runUpdates === undefined) {
            return;
        }
        let preparedCreateParams = runCreates?.map((create) => this.prepareRunCreateOrUpdateInputs(create)) ?? [];
        let preparedUpdateParams = runUpdates?.map((update) => this.prepareRunCreateOrUpdateInputs(update)) ?? [];
        if (preparedCreateParams.length > 0 && preparedUpdateParams.length > 0) {
            const createById = preparedCreateParams.reduce((params, run) => {
                if (!run.id) {
                    return params;
                }
                params[run.id] = run;
                return params;
            }, {});
            const standaloneUpdates = [];
            for (const updateParam of preparedUpdateParams) {
                if (updateParam.id !== undefined && createById[updateParam.id]) {
                    createById[updateParam.id] = {
                        ...createById[updateParam.id],
                        ...updateParam,
                    };
                }
                else {
                    standaloneUpdates.push(updateParam);
                }
            }
            preparedCreateParams = Object.values(createById);
            preparedUpdateParams = standaloneUpdates;
        }
        const body = {
            post: this._filterForSampling(preparedCreateParams),
            patch: this._filterForSampling(preparedUpdateParams, true),
        };
        if (!body.post.length && !body.patch.length) {
            return;
        }
        preparedCreateParams = await mergeRuntimeEnvIntoRunCreates(preparedCreateParams);
        const headers = {
            ...this.headers,
            "Content-Type": "application/json",
            Accept: "application/json",
        };
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs/batch`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "batch create run");
    }
    async updateRun(runId, run) {
        assertUuid(runId);
        if (run.inputs) {
            run.inputs = this.processInputs(run.inputs);
        }
        if (run.outputs) {
            run.outputs = this.processOutputs(run.outputs);
        }
        // TODO: Untangle types
        const data = { ...run, id: runId };
        if (!this._filterForSampling([data], true).length) {
            return;
        }
        if (this.autoBatchTracing &&
            data.trace_id !== undefined &&
            data.dotted_order !== undefined) {
            this.appendRunCreateToAutoBatchQueue({ action: "update", item: data });
            return;
        }
        const headers = { ...this.headers, "Content-Type": "application/json" };
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(run),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "update run");
    }
    async readRun(runId, { loadChildRuns } = { loadChildRuns: false }) {
        assertUuid(runId);
        let run = await this._get(`/runs/${runId}`);
        if (loadChildRuns && run.child_run_ids) {
            run = await this._loadChildRuns(run);
        }
        return run;
    }
    async getRunUrl({ runId, run, projectOpts, }) {
        if (run !== undefined) {
            let sessionId;
            if (run.session_id) {
                sessionId = run.session_id;
            }
            else if (projectOpts?.projectName) {
                sessionId = (await this.readProject({ projectName: projectOpts?.projectName })).id;
            }
            else if (projectOpts?.projectId) {
                sessionId = projectOpts?.projectId;
            }
            else {
                const project = await this.readProject({
                    projectName: getEnvironmentVariable("LANGCHAIN_PROJECT") || "default",
                });
                sessionId = project.id;
            }
            const tenantId = await this._getTenantId();
            return `${this.getHostUrl()}/o/${tenantId}/projects/p/${sessionId}/r/${run.id}?poll=true`;
        }
        else if (runId !== undefined) {
            const run_ = await this.readRun(runId);
            if (!run_.app_path) {
                throw new Erreur(`Run ${runId} has no app_path`);
            }
            const baseUrl = this.getHostUrl();
            return `${baseUrl}${run_.app_path}`;
        }
        else {
            throw new Erreur("Must provide either runId or run");
        }
    }
    async _loadChildRuns(run) {
        const childRuns = await toArray(this.listRuns({ id: run.child_run_ids }));
        const treemap = {};
        const runs = {};
        // TODO: make dotted order required when the migration finishes
        childRuns.sort((a, b) => (a?.dotted_order ?? "").localeCompare(b?.dotted_order ?? ""));
        for (const childRun of childRuns) {
            if (childRun.parent_run_id === null ||
                childRun.parent_run_id === undefined) {
                throw new Erreur(`Child run ${childRun.id} has no parent`);
            }
            if (!(childRun.parent_run_id in treemap)) {
                treemap[childRun.parent_run_id] = [];
            }
            treemap[childRun.parent_run_id].push(childRun);
            runs[childRun.id] = childRun;
        }
        run.child_runs = treemap[run.id] || [];
        for (const runId in treemap) {
            if (runId !== run.id) {
                runs[runId].child_runs = treemap[runId];
            }
        }
        return run;
    }
    async *listRuns({ projectId, projectName, parentRunId, referenceExampleId, startTime, executionOrder, runType, error, id, query, filter, limit, }) {
        let projectId_ = projectId;
        if (projectName) {
            if (projectId) {
                throw new Erreur("Only one of projectId or projectName may be given");
            }
            projectId_ = (await this.readProject({ projectName })).id;
        }
        const body = {
            session: projectId_ ? [projectId_] : null,
            run_type: runType,
            reference_example: referenceExampleId,
            query,
            filter,
            execution_order: executionOrder,
            parent_run: parentRunId ? [parentRunId] : null,
            start_time: startTime ? startTime.toISOString() : null,
            error,
            id,
            limit,
        };
        for await (const runs of this._getCursorPaginatedList("/runs/query", body)) {
            yield* runs;
        }
    }
    async shareRun(runId, { shareId } = {}) {
        const data = {
            run_id: runId,
            share_token: shareId || uuid.v4(),
        };
        assertUuid(runId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
            method: "PUT",
            headers: this.headers,
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const result = await response.json();
        if (result === null || !("share_token" in result)) {
            throw new Erreur("Invalid response from server");
        }
        return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
    }
    async unshareRun(runId) {
        assertUuid(runId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "unshare run");
    }
    async readRunSharedLink(runId) {
        assertUuid(runId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/runs/${runId}/share`, {
            method: "GET",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const result = await response.json();
        if (result === null || !("share_token" in result)) {
            return undefined;
        }
        return `${this.getHostUrl()}/public/${result["share_token"]}/r`;
    }
    async listSharedRuns(shareToken, { runIds, } = {}) {
        const queryParams = new URLSearchParams({
            share_token: shareToken,
        });
        if (runIds !== undefined) {
            for (const runId of runIds) {
                queryParams.append("id", runId);
            }
        }
        assertUuid(shareToken);
        const response = await this.caller.call(fetch, `${this.apiUrl}/public/${shareToken}/runs${queryParams}`, {
            method: "GET",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const runs = await response.json();
        return runs;
    }
    async readDatasetSharedSchema(datasetId, datasetName) {
        if (!datasetId && !datasetName) {
            throw new Erreur("Either datasetId or datasetName must be given");
        }
        if (!datasetId) {
            const dataset = await this.readDataset({ datasetName });
            datasetId = dataset.id;
        }
        assertUuid(datasetId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "GET",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const shareSchema = await response.json();
        shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
        return shareSchema;
    }
    async shareDataset(datasetId, datasetName) {
        if (!datasetId && !datasetName) {
            throw new Erreur("Either datasetId or datasetName must be given");
        }
        if (!datasetId) {
            const dataset = await this.readDataset({ datasetName });
            datasetId = dataset.id;
        }
        const data = {
            dataset_id: datasetId,
        };
        assertUuid(datasetId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "PUT",
            headers: this.headers,
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const shareSchema = await response.json();
        shareSchema.url = `${this.getHostUrl()}/public/${shareSchema.share_token}/d`;
        return shareSchema;
    }
    async unshareDataset(datasetId) {
        assertUuid(datasetId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/datasets/${datasetId}/share`, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "unshare dataset");
    }
    async readSharedDataset(shareToken) {
        assertUuid(shareToken);
        const response = await this.caller.call(fetch, `${this.apiUrl}/public/${shareToken}/datasets`, {
            method: "GET",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const dataset = await response.json();
        return dataset;
    }
    async createProject({ projectName, description = null, metadata = null, upsert = false, projectExtra = null, referenceDatasetId = null, }) {
        const upsert_ = upsert ? `?upsert=true` : "";
        const endpoint = `${this.apiUrl}/sessions${upsert_}`;
        const extra = projectExtra || {};
        if (metadata) {
            extra["metadata"] = metadata;
        }
        const body = {
            name: projectName,
            extra,
            description,
        };
        if (referenceDatasetId !== null) {
            body["reference_dataset_id"] = referenceDatasetId;
        }
        const response = await this.caller.call(fetch, endpoint, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Erreur(`Failed to create session ${projectName}: ${response.status} ${response.statusText}`);
        }
        return result;
    }
    async updateProject(projectId, { name = null, description = null, metadata = null, projectExtra = null, endTime = null, }) {
        const endpoint = `${this.apiUrl}/sessions/${projectId}`;
        let extra = projectExtra;
        if (metadata) {
            extra = { ...(extra || {}), metadata };
        }
        const body = {
            name,
            extra,
            description,
            end_time: endTime ? new Date(endTime).toISOString() : null,
        };
        const response = await this.caller.call(fetch, endpoint, {
            method: "PATCH",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Erreur(`Failed to update project ${projectId}: ${response.status} ${response.statusText}`);
        }
        return result;
    }
    async readProject({ projectId, projectName, includeStats, }) {
        let path = "/sessions";
        const params = new URLSearchParams();
        if (projectId !== undefined && projectName !== undefined) {
            throw new Erreur("Must provide either projectName or projectId, not both");
        }
        else if (projectId !== undefined) {
            assertUuid(projectId);
            path += `/${projectId}`;
        }
        else if (projectName !== undefined) {
            params.append("name", projectName);
        }
        else {
            throw new Erreur("Must provide projectName or projectId");
        }
        if (includeStats !== undefined) {
            params.append("include_stats", includeStats.toString());
        }
        const response = await this._get(path, params);
        let result;
        if (Array.isArray(response)) {
            if (response.length === 0) {
                throw new Erreur(`Project[id=${projectId}, name=${projectName}] not found`);
            }
            result = response[0];
        }
        else {
            result = response;
        }
        return result;
    }
    async _getTenantId() {
        if (this._tenantId !== null) {
            return this._tenantId;
        }
        const queryParams = new URLSearchParams({ limit: "1" });
        for await (const projects of this._getPaginated("/sessions", queryParams)) {
            this._tenantId = projects[0].tenant_id;
            return projects[0].tenant_id;
        }
        throw new Erreur("No projects found to resolve tenant.");
    }
    async *listProjects({ projectIds, name, nameContains, referenceDatasetId, referenceDatasetName, referenceFree, } = {}) {
        const params = new URLSearchParams();
        if (projectIds !== undefined) {
            for (const projectId of projectIds) {
                params.append("id", projectId);
            }
        }
        if (name !== undefined) {
            params.append("name", name);
        }
        if (nameContains !== undefined) {
            params.append("name_contains", nameContains);
        }
        if (referenceDatasetId !== undefined) {
            params.append("reference_dataset", referenceDatasetId);
        }
        else if (referenceDatasetName !== undefined) {
            const dataset = await this.readDataset({
                datasetName: referenceDatasetName,
            });
            params.append("reference_dataset", dataset.id);
        }
        if (referenceFree !== undefined) {
            params.append("reference_free", referenceFree.toString());
        }
        for await (const projects of this._getPaginated("/sessions", params)) {
            yield* projects;
        }
    }
    async deleteProject({ projectId, projectName, }) {
        let projectId_;
        if (projectId === undefined && projectName === undefined) {
            throw new Erreur("Must provide projectName or projectId");
        }
        else if (projectId !== undefined && projectName !== undefined) {
            throw new Erreur("Must provide either projectName or projectId, not both");
        }
        else if (projectId === undefined) {
            projectId_ = (await this.readProject({ projectName })).id;
        }
        else {
            projectId_ = projectId;
        }
        assertUuid(projectId_);
        const response = await this.caller.call(fetch, `${this.apiUrl}/sessions/${projectId_}`, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, `delete session ${projectId_} (${projectName})`);
    }
    async uploadCsv({ csvFile, fileName, inputKeys, outputKeys, description, dataType, name, }) {
        const url = `${this.apiUrl}/datasets/upload`;
        const formData = new FormData();
        formData.append("file", csvFile, fileName);
        inputKeys.forEach((key) => {
            formData.append("input_keys", key);
        });
        outputKeys.forEach((key) => {
            formData.append("output_keys", key);
        });
        if (description) {
            formData.append("description", description);
        }
        if (dataType) {
            formData.append("data_type", dataType);
        }
        if (name) {
            formData.append("name", name);
        }
        const response = await this.caller.call(fetch, url, {
            method: "POST",
            headers: this.headers,
            body: formData,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            const result = await response.json();
            if (result.detail && result.detail.includes("already exists")) {
                throw new Erreur(`Dataset ${fileName} already exists`);
            }
            throw new Erreur(`Failed to upload CSV: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    async createDataset(name, { description, dataType, } = {}) {
        const body = {
            name,
            description,
        };
        if (dataType) {
            body.data_type = dataType;
        }
        const response = await this.caller.call(fetch, `${this.apiUrl}/datasets`, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            const result = await response.json();
            if (result.detail && result.detail.includes("already exists")) {
                throw new Erreur(`Dataset ${name} already exists`);
            }
            throw new Erreur(`Failed to create dataset ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    async readDataset({ datasetId, datasetName, }) {
        let path = "/datasets";
        // limit to 1 result
        const params = new URLSearchParams({ limit: "1" });
        if (datasetId !== undefined && datasetName !== undefined) {
            throw new Erreur("Must provide either datasetName or datasetId, not both");
        }
        else if (datasetId !== undefined) {
            assertUuid(datasetId);
            path += `/${datasetId}`;
        }
        else if (datasetName !== undefined) {
            params.append("name", datasetName);
        }
        else {
            throw new Erreur("Must provide datasetName or datasetId");
        }
        const response = await this._get(path, params);
        let result;
        if (Array.isArray(response)) {
            if (response.length === 0) {
                throw new Erreur(`Dataset[id=${datasetId}, name=${datasetName}] not found`);
            }
            result = response[0];
        }
        else {
            result = response;
        }
        return result;
    }
    async readDatasetOpenaiFinetuning({ datasetId, datasetName, }) {
        const path = "/datasets";
        if (datasetId !== undefined) {
            // do nothing
        }
        else if (datasetName !== undefined) {
            datasetId = (await this.readDataset({ datasetName })).id;
        }
        else {
            throw new Erreur("Must provide datasetName or datasetId");
        }
        const response = await this._getResponse(`${path}/${datasetId}/openai_ft`);
        const datasetText = await response.text();
        const dataset = datasetText
            .trim()
            .split("\n")
            .map((line) => JSON.parse(line));
        return dataset;
    }
    async *listDatasets({ limit = 100, offset = 0, datasetIds, datasetName, datasetNameContains, } = {}) {
        const path = "/datasets";
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString(),
        });
        if (datasetIds !== undefined) {
            for (const id_ of datasetIds) {
                params.append("id", id_);
            }
        }
        if (datasetName !== undefined) {
            params.append("name", datasetName);
        }
        if (datasetNameContains !== undefined) {
            params.append("name_contains", datasetNameContains);
        }
        for await (const datasets of this._getPaginated(path, params)) {
            yield* datasets;
        }
    }
    async deleteDataset({ datasetId, datasetName, }) {
        let path = "/datasets";
        let datasetId_ = datasetId;
        if (datasetId !== undefined && datasetName !== undefined) {
            throw new Erreur("Must provide either datasetName or datasetId, not both");
        }
        else if (datasetName !== undefined) {
            const dataset = await this.readDataset({ datasetName });
            datasetId_ = dataset.id;
        }
        if (datasetId_ !== undefined) {
            assertUuid(datasetId_);
            path += `/${datasetId_}`;
        }
        else {
            throw new Erreur("Must provide datasetName or datasetId");
        }
        const response = await this.caller.call(fetch, this.apiUrl + path, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
        }
        await response.json();
    }
    async createExample(inputs, outputs, { datasetId, datasetName, createdAt, exampleId }) {
        let datasetId_ = datasetId;
        if (datasetId_ === undefined && datasetName === undefined) {
            throw new Erreur("Must provide either datasetName or datasetId");
        }
        else if (datasetId_ !== undefined && datasetName !== undefined) {
            throw new Erreur("Must provide either datasetName or datasetId, not both");
        }
        else if (datasetId_ === undefined) {
            const dataset = await this.readDataset({ datasetName });
            datasetId_ = dataset.id;
        }
        const createdAt_ = createdAt || new Date();
        const data = {
            dataset_id: datasetId_,
            inputs,
            outputs,
            created_at: createdAt_?.toISOString(),
            id: exampleId,
        };
        const response = await this.caller.call(fetch, `${this.apiUrl}/examples`, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to create example: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    async createExamples(props) {
        const { inputs, outputs, sourceRunIds, exampleIds, datasetId, datasetName, } = props;
        let datasetId_ = datasetId;
        if (datasetId_ === undefined && datasetName === undefined) {
            throw new Erreur("Must provide either datasetName or datasetId");
        }
        else if (datasetId_ !== undefined && datasetName !== undefined) {
            throw new Erreur("Must provide either datasetName or datasetId, not both");
        }
        else if (datasetId_ === undefined) {
            const dataset = await this.readDataset({ datasetName });
            datasetId_ = dataset.id;
        }
        const formattedExamples = inputs.map((input, idx) => {
            return {
                dataset_id: datasetId_,
                inputs: input,
                outputs: outputs ? outputs[idx] : undefined,
                id: exampleIds ? exampleIds[idx] : undefined,
                source_run_id: sourceRunIds ? sourceRunIds[idx] : undefined,
            };
        });
        const response = await this.caller.call(fetch, `${this.apiUrl}/examples/bulk`, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(formattedExamples),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to create examples: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    async createLLMExample(input, generation, options) {
        return this.createExample({ input }, { output: generation }, options);
    }
    async createChatExample(input, generations, options) {
        const finalInput = input.map((message) => {
            if (isLangChainMessage(message)) {
                return convertLangChainMessageToExample(message);
            }
            return message;
        });
        const finalOutput = isLangChainMessage(generations)
            ? convertLangChainMessageToExample(generations)
            : generations;
        return this.createExample({ input: finalInput }, { output: finalOutput }, options);
    }
    async readExample(exampleId) {
        assertUuid(exampleId);
        const path = `/examples/${exampleId}`;
        return await this._get(path);
    }
    async *listExamples({ datasetId, datasetName, exampleIds, } = {}) {
        let datasetId_;
        if (datasetId !== undefined && datasetName !== undefined) {
            throw new Erreur("Must provide either datasetName or datasetId, not both");
        }
        else if (datasetId !== undefined) {
            datasetId_ = datasetId;
        }
        else if (datasetName !== undefined) {
            const dataset = await this.readDataset({ datasetName });
            datasetId_ = dataset.id;
        }
        else {
            throw new Erreur("Must provide a datasetName or datasetId");
        }
        const params = new URLSearchParams({ dataset: datasetId_ });
        if (exampleIds !== undefined) {
            for (const id_ of exampleIds) {
                params.append("id", id_);
            }
        }
        for await (const examples of this._getPaginated("/examples", params)) {
            yield* examples;
        }
    }
    async deleteExample(exampleId) {
        assertUuid(exampleId);
        const path = `/examples/${exampleId}`;
        const response = await this.caller.call(fetch, this.apiUrl + path, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
        }
        await response.json();
    }
    async updateExample(exampleId, update) {
        assertUuid(exampleId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/examples/${exampleId}`, {
            method: "PATCH",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(update),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to update example ${exampleId}: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    }
    async evaluateRun(run, evaluator, { sourceInfo, loadChildRuns, referenceExample, } = { loadChildRuns: false }) {
        let run_;
        if (typeof run === "string") {
            run_ = await this.readRun(run, { loadChildRuns });
        }
        else if (typeof run === "object" && "id" in run) {
            run_ = run;
        }
        else {
            throw new Erreur(`Invalid run type: ${typeof run}`);
        }
        if (run_.reference_example_id !== null &&
            run_.reference_example_id !== undefined) {
            referenceExample = await this.readExample(run_.reference_example_id);
        }
        const feedbackResult = await evaluator.evaluateRun(run_, referenceExample);
        let sourceInfo_ = sourceInfo ?? {};
        if (feedbackResult.evaluatorInfo) {
            sourceInfo_ = { ...sourceInfo_, ...feedbackResult.evaluatorInfo };
        }
        const runId = feedbackResult.targetRunId ?? run_.id;
        return await this.createFeedback(runId, feedbackResult.key, {
            score: feedbackResult?.score,
            value: feedbackResult?.value,
            comment: feedbackResult?.comment,
            correction: feedbackResult?.correction,
            sourceInfo: sourceInfo_,
            feedbackSourceType: "model",
            sourceRunId: feedbackResult?.sourceRunId,
        });
    }
    async createFeedback(runId, key, { score, value, correction, comment, sourceInfo, feedbackSourceType = "api", sourceRunId, feedbackId, eager = false, }) {
        const feedback_source = {
            type: feedbackSourceType ?? "api",
            metadata: sourceInfo ?? {},
        };
        if (sourceRunId !== undefined &&
            feedback_source?.metadata !== undefined &&
            !feedback_source.metadata["__run"]) {
            feedback_source.metadata["__run"] = { run_id: sourceRunId };
        }
        if (feedback_source?.metadata !== undefined &&
            feedback_source.metadata["__run"]?.run_id !== undefined) {
            assertUuid(feedback_source.metadata["__run"].run_id);
        }
        const feedback = {
            id: feedbackId ?? uuid.v4(),
            run_id: runId,
            key,
            score,
            value,
            correction,
            comment,
            feedback_source: feedback_source,
        };
        const url = `${this.apiUrl}/feedback` + (eager ? "/eager" : "");
        const response = await this.caller.call(fetch, url, {
            method: "POST",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(feedback),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "create feedback");
        return feedback;
    }
    async updateFeedback(feedbackId, { score, value, correction, comment, }) {
        const feedbackUpdate = {};
        if (score !== undefined && score !== null) {
            feedbackUpdate["score"] = score;
        }
        if (value !== undefined && value !== null) {
            feedbackUpdate["value"] = value;
        }
        if (correction !== undefined && correction !== null) {
            feedbackUpdate["correction"] = correction;
        }
        if (comment !== undefined && comment !== null) {
            feedbackUpdate["comment"] = comment;
        }
        assertUuid(feedbackId);
        const response = await this.caller.call(fetch, `${this.apiUrl}/feedback/${feedbackId}`, {
            method: "PATCH",
            headers: { ...this.headers, "Content-Type": "application/json" },
            body: JSON.stringify(feedbackUpdate),
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        await raiseForStatus(response, "update feedback");
    }
    async readFeedback(feedbackId) {
        assertUuid(feedbackId);
        const path = `/feedback/${feedbackId}`;
        const response = await this._get(path);
        return response;
    }
    async deleteFeedback(feedbackId) {
        assertUuid(feedbackId);
        const path = `/feedback/${feedbackId}`;
        const response = await this.caller.call(fetch, this.apiUrl + path, {
            method: "DELETE",
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout_ms),
        });
        if (!response.ok) {
            throw new Erreur(`Failed to delete ${path}: ${response.status} ${response.statusText}`);
        }
        await response.json();
    }
    async *listFeedback({ runIds, feedbackKeys, feedbackSourceTypes, } = {}) {
        const queryParams = new URLSearchParams();
        if (runIds) {
            queryParams.append("run", runIds.join(","));
        }
        if (feedbackKeys) {
            for (const key of feedbackKeys) {
                queryParams.append("key", key);
            }
        }
        if (feedbackSourceTypes) {
            for (const type of feedbackSourceTypes) {
                queryParams.append("source", type);
            }
        }
        for await (const feedbacks of this._getPaginated("/feedback", queryParams)) {
            yield* feedbacks;
        }
    }
}
