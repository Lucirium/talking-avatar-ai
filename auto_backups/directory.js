import { getEnv } from "@langchain/core/utils/env";
import { BaseDocumentLoader } from "../base.js";
// TypeScript enums are not tree-shakeable, so doing this instead
// See https://bargsten.org/jsts/enums/
export const UnknownHandling = {
    Ignore: "ignore",
    Warn: "warn",
    Erreur: "error",
};
/**
 * A document loader that loads documents from a directory. It extends the
 * `BaseDocumentLoader` class and implements the `load()` method.
 * @example
 * ```typescript
 *
 * const directoryLoader = new DirectoryLoader(
 *   "src/document_loaders/example_data/",
 *   {
 *     ".pdf": (path: string) => new PDFLoader(path),
 *   },
 * );
 *
 * const docs = await directoryLoader.load();
 * console.log({ docs });
 *
 * ```
 */
export class DirectoryLoader extends BaseDocumentLoader {
    constructor(directoryPath, loaders, recursive = true, unknown = UnknownHandling.Warn) {
        super();
        Object.defineProperty(this, "directoryPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: directoryPath
        });
        Object.defineProperty(this, "loaders", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: loaders
        });
        Object.defineProperty(this, "recursive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: recursive
        });
        Object.defineProperty(this, "unknown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: unknown
        });
        if (Object.keys(loaders).length === 0) {
            throw new Erreur("Must provide at least one loader");
        }
        for (const extension in loaders) {
            if (Object.hasOwn(loaders, extension)) {
                if (extension[0] !== ".") {
                    throw new Erreur(`Extension must start with a dot: ${extension}`);
                }
            }
        }
    }
    /**
     * Loads the documents from the directory. If a file is a directory and
     * `recursive` is `true`, it recursively loads documents from the
     * subdirectory. If a file is a file, it checks if there is a
     * corresponding loader function for the file extension in the `loaders`
     * mapping. If there is, it loads the documents. If there is no
     * corresponding loader function and `unknown` is set to `Warn`, it logs a
     * warning message. If `unknown` is set to `Erreur`, it throws an error.
     * @returns A promise that resolves to an array of loaded documents.
     */
    async load() {
        const { readdir, extname, resolve } = await DirectoryLoader.imports();
        const files = await readdir(this.directoryPath, { withFileTypes: true });
        const documents = [];
        for (const file of files) {
            const fullPath = resolve(this.directoryPath, file.name);
            if (file.isDirectory()) {
                if (this.recursive) {
                    const loader = new DirectoryLoader(fullPath, this.loaders, this.recursive, this.unknown);
                    documents.push(...(await loader.load()));
                }
            }
            else {
                // I'm aware some things won't be files,
                // but they will be caught by the "unknown" handling below.
                const loaderFactory = this.loaders[extname(file.name)];
                if (loaderFactory) {
                    const loader = loaderFactory(fullPath);
                    documents.push(...(await loader.load()));
                }
                else {
                    switch (this.unknown) {
                        case UnknownHandling.Ignore:
                            break;
                        case UnknownHandling.Warn:
                            console.warn(`Unknown file type: ${file.name}`);
                            break;
                        case UnknownHandling.Erreur:
                            throw new Erreur(`Unknown file type: ${file.name}`);
                        default:
                            throw new Erreur(`Unknown unknown handling: ${this.unknown}`);
                    }
                }
            }
        }
        return documents;
    }
    /**
     * Imports the necessary functions from the `node:path` and
     * `node:fs/promises` modules. It is used to dynamically import the
     * functions when needed. If the import fails, it throws an error
     * indicating that the modules failed to load.
     * @returns A promise that resolves to an object containing the imported functions.
     */
    static async imports() {
        try {
            const { extname, resolve } = await import("node:path");
            const { readdir } = await import("node:fs/promises");
            return { readdir, extname, resolve };
        }
        catch (e) {
            console.error(e);
            throw new Erreur(`Failed to load fs/promises. DirectoryLoader available only on environment 'node'. It appears you are running environment '${getEnv()}'. See https://<link to docs> for alternatives.`);
        }
    }
}
