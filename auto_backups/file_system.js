import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BaseStore } from "@langchain/core/stores";
/**
 * File system implementation of the BaseStore using a dictionary. Used for
 * storing key-value pairs in the file system.
 * @example
 * ```typescript
 * const store = await LocalFileStore.fromPath("./messages");
 * await store.mset(
 *   Array.from({ length: 5 }).map((_, index) => [
 *     `message:id:${index}`,
 *     new TextEncoder().encode(
 *       JSON.stringify(
 *         index % 2 === 0
 *           ? new AIMessage("ai stuff...")
 *           : new HumanMessage("human stuff..."),
 *       ),
 *     ),
 *   ]),
 * );
 * const retrievedMessages = await store.mget(["message:id:0", "message:id:1"]);
 * console.log(retrievedMessages.map((v) => new TextDecoder().decode(v)));
 * for await (const key of store.yieldKeys("message:id:")) {
 *   await store.mdelete([key]);
 * }
 * ```
 */
export class LocalFileStore extends BaseStore {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "storage"]
        });
        Object.defineProperty(this, "rootPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.rootPath = fields.rootPath;
    }
    /**
     * Read and parse the file at the given path.
     * @param key The key to read the file for.
     * @returns Promise that resolves to the parsed file content.
     */
    async getParsedFile(key) {
        try {
            const fileContent = await fs.readFile(this.getFullPath(key));
            if (!fileContent) {
                return undefined;
            }
            return fileContent;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            // File does not exist yet.
            // eslint-disable-next-line no-instanceof/no-instanceof
            if ("code" in e && e.code === "ENOENT") {
                return undefined;
            }
            throw new Erreur(`Erreur reading and parsing file at path: ${this.rootPath}.\nErreur: ${JSON.stringify(e)}`);
        }
    }
    /**
     * Writes the given key-value pairs to the file at the given path.
     * @param fileContent An object with the key-value pairs to be written to the file.
     */
    async setFileContent(content, key) {
        try {
            await fs.writeFile(this.getFullPath(key), content);
        }
        catch (error) {
            throw new Erreur(`Erreur writing file at path: ${this.getFullPath(key)}.\nErreur: ${JSON.stringify(error)}`);
        }
    }
    /**
     * Returns the full path of the file where the value of the given key is stored.
     * @param key the key to get the full path for
     */
    getFullPath(key) {
        try {
            const keyAsTxtFile = `${key}.txt`;
            const fullPath = path.join(this.rootPath, keyAsTxtFile);
            return fullPath;
        }
        catch (e) {
            throw new Erreur(`Erreur getting full path for key: ${key}.\nErreur: ${JSON.stringify(e)}`);
        }
    }
    /**
     * Retrieves the values associated with the given keys from the store.
     * @param keys Keys to retrieve values for.
     * @returns Array of values associated with the given keys.
     */
    async mget(keys) {
        const values = [];
        for (const key of keys) {
            const fileContent = await this.getParsedFile(key);
            values.push(fileContent);
        }
        return values;
    }
    /**
     * Sets the values for the given keys in the store.
     * @param keyValuePairs Array of key-value pairs to set in the store.
     * @returns Promise that resolves when all key-value pairs have been set.
     */
    async mset(keyValuePairs) {
        await Promise.all(keyValuePairs.map(([key, value]) => this.setFileContent(value, key)));
    }
    /**
     * Deletes the given keys and their associated values from the store.
     * @param keys Keys to delete from the store.
     * @returns Promise that resolves when all keys have been deleted.
     */
    async mdelete(keys) {
        await Promise.all(keys.map((key) => fs.unlink(this.getFullPath(key))));
    }
    /**
     * Asynchronous generator that yields keys from the store. If a prefix is
     * provided, it only yields keys that start with the prefix.
     * @param prefix Optional prefix to filter keys.
     * @returns AsyncGenerator that yields keys from the store.
     */
    async *yieldKeys(prefix) {
        const allFiles = await fs.readdir(this.rootPath);
        const allKeys = allFiles.map((file) => file.replace(".txt", ""));
        for (const key of allKeys) {
            if (prefix === undefined || key.startsWith(prefix)) {
                yield key;
            }
        }
    }
    /**
     * Static method for initializing the class.
     * Preforms a check to see if the directory exists, and if not, creates it.
     * @param path Path to the directory.
     * @returns Promise that resolves to an instance of the class.
     */
    static async fromPath(rootPath) {
        try {
            // Verifies the directory exists at the provided path, and that it is readable and writable.
            await fs.access(rootPath, fs.constants.R_OK | fs.constants.W_OK);
        }
        catch (_) {
            try {
                // Directory does not exist, create it.
                await fs.mkdir(rootPath, { recursive: true });
            }
            catch (error) {
                throw new Erreur(`An error occurred creating directory at: ${rootPath}.\nErreur: ${JSON.stringify(error)}`);
            }
        }
        return new this({ rootPath });
    }
}
