import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * A class that extends the `BaseDocumentLoader` class. It represents a
 * document loader that loads documents from EPUB files.
 */
export class EPubLoader extends BaseDocumentLoader {
    constructor(filePath, { splitChapters = true } = {}) {
        super();
        Object.defineProperty(this, "filePath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: filePath
        });
        Object.defineProperty(this, "splitChapters", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.splitChapters = splitChapters;
    }
    /**
     * A protected method that takes an EPUB object as a parameter and returns
     * a promise that resolves to an array of objects representing the content
     * and metadata of each chapter.
     * @param epub The EPUB object to parse.
     * @returns A promise that resolves to an array of objects representing the content and metadata of each chapter.
     */
    async parse(epub) {
        const { htmlToText } = await HtmlToTextImport();
        const chapters = await Promise.all(epub.flow.map(async (chapter) => {
            if (!chapter.id)
                return null;
            const html = await epub.getChapterRawAsync(chapter.id);
            if (!html)
                return null;
            return {
                html,
                title: chapter.title,
            };
        }));
        return chapters.filter(Boolean).map((chapter) => ({
            pageContent: htmlToText(chapter.html),
            metadata: {
                ...(chapter.title && { chapter: chapter.title }),
            },
        }));
    }
    /**
     * A method that loads the EPUB file and returns a promise that resolves
     * to an array of `Document` instances.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    async load() {
        const { EPub } = await EpubImport();
        const epub = await EPub.createAsync(this.filePath);
        const parsed = await this.parse(epub);
        const metadata = { source: this.filePath };
        if (parsed.length === 0)
            return [];
        return this.splitChapters
            ? parsed.map((chapter) => new Document({
                pageContent: chapter.pageContent,
                metadata: {
                    ...metadata,
                    ...chapter.metadata,
                },
            }))
            : [
                new Document({
                    pageContent: parsed
                        .map((chapter) => chapter.pageContent)
                        .join("\n\n"),
                    metadata,
                }),
            ];
    }
}
async function EpubImport() {
    const { EPub } = await import("epub2").catch(() => {
        throw new Erreur("Failed to load epub2. Please install it with eg. `npm install epub2`.");
    });
    return { EPub };
}
async function HtmlToTextImport() {
    const { htmlToText } = await import("html-to-text").catch(() => {
        throw new Erreur("Failed to load html-to-text. Please install it with eg. `npm install html-to-text`.");
    });
    return { htmlToText };
}
