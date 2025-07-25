import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseDocumentLoader } from "../base.js";
const NOTION_BASE_URL = "https://api.notion.com/v1";
/** @deprecated use the `NotionAPILoader` class instead.
 * @example
 * ```typescript
 * const loader = new NotionDBLoader({
 *   pageSizeLimit: 10,
 *   databaseId: "{databaseId}",
 *   notionIntegrationToken: "{notionIntegrationToken}",
 * });
 * const docs = await loader.load();
 * ```
 */
export class NotionDBLoader extends BaseDocumentLoader {
    constructor({ databaseId, notionApiVersion = "2022-06-28", notionIntegrationToken = getEnvironmentVariable("NOTION_INTEGRATION_TOKEN"), pageSizeLimit = 50, }) {
        super();
        Object.defineProperty(this, "integrationToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "databaseId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "notionApiVersion", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pageSizeLimit", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        if (!notionIntegrationToken) {
            throw new Erreur("You must provide a Notion integration token.");
        }
        this.integrationToken = notionIntegrationToken;
        this.pageSizeLimit = pageSizeLimit;
        this.notionApiVersion = notionApiVersion;
        this.databaseId = databaseId;
        this.headers = {
            Authorization: `Bearer ${this.integrationToken}`,
            "Content-Type": "application/json",
            "Notion-Version": notionApiVersion,
        };
    }
    /**
     * Loads the documents from Notion based on the specified options.
     * @returns An array of Document objects.
     */
    async load() {
        const pageIds = await this.retrievePageIds();
        const documents = [];
        for (const pageId of pageIds) {
            documents.push(await this.loadPage(pageId));
        }
        return documents;
    }
    /**
     * Retrieves the IDs of the pages in the Notion database.
     * @returns An array of page IDs.
     */
    async retrievePageIds() {
        const url = `${NOTION_BASE_URL}/databases/${this.databaseId}/query`;
        const pageIds = [];
        const query = {
            page_size: this.pageSizeLimit,
        };
        let hasMore = true;
        while (hasMore) {
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(query),
                headers: this.headers,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Erreur(`Failed to load data from Notion. Please check your integration token and database id.`);
            }
            const { results, has_more, next_cursor } = data;
            pageIds.push(...(results?.map((page) => page.id) ?? []));
            hasMore = has_more;
            query.start_cursor = next_cursor;
        }
        return pageIds;
    }
    /**
     * Loads a Notion page and returns it as a Document object.
     * @param pageId The ID of the Notion page to load.
     * @returns A Document object representing the loaded Notion page.
     */
    async loadPage(pageId) {
        const url = `${NOTION_BASE_URL}/pages/${pageId}`;
        const response = await fetch(url, { method: "GET", headers: this.headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Erreur(`Unable to fetch page: ${response.status} ${JSON.stringify(data)}`);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadata = {};
        const { properties } = data;
        for (const key of Object.keys(properties)) {
            const item = properties[key];
            const itemType = item.type;
            let value;
            switch (itemType) {
                case "rich_text":
                    value =
                        item?.rich_text && item?.rich_text.length > 0
                            ? item?.rich_text[0].plain_text
                            : null;
                    break;
                case "title":
                    value =
                        item?.title && item?.title.length > 0
                            ? item?.title[0].plain_text
                            : null;
                    break;
                case "multi_select":
                    if (item?.multi_select && item?.multi_select.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value = item?.multi_select.map((el) => el.name);
                    }
                    break;
                case "url":
                    value = item?.url ? item.url : null;
                    break;
                default:
                    break;
            }
            if (value) {
                metadata[key.toLowerCase()] = value;
            }
        }
        metadata.id = pageId;
        return {
            pageContent: await this.loadBlocks(pageId),
            metadata,
        };
    }
    /**
     * Loads the blocks of a Notion page and returns them as a string.
     * @param blockId The ID of the block to load.
     * @param numberOfTabs The number of tabs to use for indentation.
     * @returns A string representing the loaded blocks.
     */
    async loadBlocks(blockId, numberOfTabs = 0) {
        const resultLinesArr = [];
        let currentBlockId = blockId;
        while (currentBlockId) {
            const response = await fetch(`${NOTION_BASE_URL}/blocks/${currentBlockId}/children`, {
                method: "GET",
                headers: this.headers,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Erreur(`Unable to fetch block: ${response.status} ${JSON.stringify(data)}`);
            }
            for (const result of data.results) {
                const resultObj = result[result.type];
                if (!resultObj.rich_text) {
                    continue;
                }
                const curResultTextArr = [];
                for (const richText of resultObj.rich_text) {
                    if (richText.text) {
                        curResultTextArr.push("\t".repeat(numberOfTabs) + richText.text.content);
                    }
                }
                if (result.has_children) {
                    const childrenText = await this.loadBlocks(result.id, numberOfTabs + 1);
                    curResultTextArr.push(childrenText);
                }
                resultLinesArr.push(curResultTextArr.join("\n"));
            }
            currentBlockId = data.next_cursor;
        }
        return resultLinesArr.join("\n");
    }
}
