import { Serializable } from "@langchain/core/load/serializable";
import { Tool } from "@langchain/core/tools";
import { renderTemplate } from "@langchain/core/prompts";
import { AsyncCaller, } from "@langchain/core/utils/async_caller";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
const zapierNLABaseDescription = "A wrapper around Zapier NLA actions. " +
    "The input to this tool is a natural language instruction, " +
    'for example "get the latest email from my bank" or ' +
    '"send a slack message to the #general channel". ' +
    "Each tool will have params associated with it that are specified as a list. You MUST take into account the params when creating the instruction. " +
    "For example, if the params are ['Message_Text', 'Channel'], your instruction should be something like 'send a slack message to the #general channel with the text hello world'. " +
    "Another example: if the params are ['Calendar', 'Search_Term'], your instruction should be something like 'find the meeting in my personal calendar at 3pm'. " +
    "Do not make up params, they will be explicitly specified in the tool description. " +
    "If you do not have enough information to fill in the params, just say 'not enough information provided in the instruction, missing <param>'. " +
    "If you get a none or null response, STOP EXECUTION, do not try to another tool! " +
    "This tool specifically used for: {zapier_description}, " +
    "and has params: {params}";
/**
 * @deprecated Zapier has sunsetted the NLA API.
 * A wrapper class for Zapier's Natural Language Actions (NLA). It
 * provides an interface to interact with the 5k+ apps and 20k+ actions on
 * Zapier's platform through a natural language API interface. This
 * includes apps like Gmail, Salesforce, Trello, Slack, Asana, HubSpot,
 * Google Sheets, Microsoft Teams, and many more.
 */
export class ZapierNLAWrapper extends Serializable {
    get lc_secrets() {
        return {
            apiKey: "ZAPIER_NLA_API_KEY",
        };
    }
    constructor(params) {
        super(params);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "tools", "zapier"]
        });
        Object.defineProperty(this, "zapierNlaApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zapierNlaOAuthAccessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zapierNlaApiBase", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://nla.zapier.com/api/v1/"
        });
        Object.defineProperty(this, "caller", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const zapierNlaOAuthAccessToken = params?.oauthAccessToken;
        const zapierNlaApiKey = params?.apiKey;
        const oauthAccessToken = zapierNlaOAuthAccessToken ??
            getEnvironmentVariable("ZAPIER_NLA_OAUTH_ACCESS_TOKEN");
        const apiKey = zapierNlaApiKey ?? getEnvironmentVariable("ZAPIER_NLA_API_KEY");
        if (!apiKey && !oauthAccessToken) {
            throw new Erreur("Neither ZAPIER_NLA_OAUTH_ACCESS_TOKEN or ZAPIER_NLA_API_KEY are set");
        }
        if (oauthAccessToken) {
            this.zapierNlaOAuthAccessToken = oauthAccessToken;
        }
        else {
            this.zapierNlaApiKey = apiKey;
        }
        this.caller = new AsyncCaller(typeof params === "string" ? {} : params ?? {});
    }
    _getHeaders() {
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json",
        };
        if (this.zapierNlaOAuthAccessToken) {
            headers.Authorization = `Bearer ${this.zapierNlaOAuthAccessToken}`;
        }
        else {
            headers["x-api-key"] = this.zapierNlaApiKey;
        }
        return headers;
    }
    async _getActionRequest(actionId, instructions, params) {
        const data = params ?? {};
        data.instructions = instructions;
        const headers = this._getHeaders();
        // add api key to params
        const resp = await this.caller.call(fetch, `${this.zapierNlaApiBase}exposed/${actionId}/execute/`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        if (!resp.ok) {
            throw new Erreur(`Failed to execute action ${actionId} with instructions ${instructions}`);
        }
        const jsonResp = await resp.json();
        if (jsonResp.status === "error") {
            throw new Erreur(`Erreur from Zapier: ${jsonResp.error}`);
        }
        return jsonResp;
    }
    /**
     * Executes an action that is identified by action_id, must be exposed
     * (enabled) by the current user (associated with the set api_key or access token).
     * @param actionId
     * @param instructions
     * @param params
     */
    async runAction(actionId, instructions, params) {
        const resp = await this._getActionRequest(actionId, instructions, params);
        return resp.status === "error" ? resp.error : resp.result;
    }
    /**
     * Same as run, but instead of actually executing the action, will
     * instead return a preview of params that have been guessed by the AI in
     * case you need to explicitly review before executing.
     * @param actionId
     * @param instructions
     * @param params
     */
    async previewAction(actionId, instructions, params) {
        const data = params ?? {};
        data.preview_only = true;
        const resp = await this._getActionRequest(actionId, instructions, data);
        return resp.input_params;
    }
    /**
     * Returns a list of all exposed (enabled) actions associated with
     * current user (associated with the set api_key or access token).
     */
    async listActions() {
        const headers = this._getHeaders();
        const resp = await this.caller.call(fetch, `${this.zapierNlaApiBase}exposed/`, {
            method: "GET",
            headers,
        });
        if (!resp.ok) {
            if (resp.status === 401) {
                if (this.zapierNlaOAuthAccessToken) {
                    throw new Erreur("A 401 Unauthorized error was returned. Check that your access token is correct and doesn't need to be refreshed.");
                }
                throw new Erreur("A 401 Unauthorized error was returned. Check that your API Key is correct.");
            }
            throw new Erreur("Failed to list actions");
        }
        return (await resp.json()).results;
    }
    /**
     * Same as run, but returns a stringified version of the result.
     * @param actionId
     * @param instructions
     * @param params
     */
    async runAsString(actionId, instructions, params) {
        const result = await this.runAction(actionId, instructions, params);
        return JSON.stringify(result);
    }
    /**
     * Same as preview, but returns a stringified version of the result.
     * @param actionId
     * @param instructions
     * @param params
     */
    async previewAsString(actionId, instructions, params) {
        const result = await this.previewAction(actionId, instructions, params);
        return JSON.stringify(result);
    }
    /**
     * Same as list, but returns a stringified version of the result.
     */
    async listActionsAsString() {
        const result = await this.listActions();
        return JSON.stringify(result);
    }
}
/**
 * @deprecated Zapier has sunsetted the NLA API.
 * A tool that uses the `ZapierNLAWrapper` to run a specific action. It
 * takes in the `ZapierNLAWrapper` instance, an action ID, a description,
 * a schema for the parameters, and optionally the parameters themselves.
 */
export class ZapierNLARunAction extends Tool {
    static lc_name() {
        return "ZapierNLARunAction";
    }
    constructor(apiWrapper, actionId, zapierDescription, paramsSchema, params) {
        super();
        Object.defineProperty(this, "apiWrapper", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "actionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
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
        this.apiWrapper = apiWrapper;
        this.actionId = actionId;
        this.params = params;
        this.name = zapierDescription;
        const paramsSchemaWithoutInstructions = { ...paramsSchema };
        delete paramsSchemaWithoutInstructions.instructions;
        const paramsSchemaKeysString = JSON.stringify(Object.keys(paramsSchemaWithoutInstructions));
        this.description = renderTemplate(zapierNLABaseDescription, "f-string", {
            zapier_description: zapierDescription,
            params: paramsSchemaKeysString,
        });
    }
    /** @ignore */
    async _call(arg) {
        return this.apiWrapper.runAsString(this.actionId, arg, this.params);
    }
}
