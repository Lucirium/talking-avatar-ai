import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
import { formatDocumentsAsString } from "../../util/document.js";
/**
 * A document loader for loading data from PDFs.
 * @example
 * ```typescript
 * const loader = new WebPDFLoader(new Blob());
 * const docs = await loader.load();
 * console.log({ docs });
 * ```
 */
export class WebPDFLoader extends BaseDocumentLoader {
    constructor(blob, { splitPages = true, pdfjs = PDFLoaderImports, parsedItemSeparator = "", } = {}) {
        super();
        Object.defineProperty(this, "blob", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "splitPages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "pdfjs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "parsedItemSeparator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.blob = blob;
        this.splitPages = splitPages ?? this.splitPages;
        this.pdfjs = pdfjs;
        this.parsedItemSeparator = parsedItemSeparator;
    }
    /**
     * Loads the contents of the PDF as documents.
     * @returns An array of Documents representing the retrieved data.
     */
    async load() {
        const { getDocument, version } = await this.pdfjs();
        const parsedPdf = await getDocument({
            data: new Uint8Array(await this.blob.arrayBuffer()),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        }).promise;
        const meta = await parsedPdf.getMetadata().catch(() => null);
        const documents = [];
        for (let i = 1; i <= parsedPdf.numPages; i += 1) {
            const page = await parsedPdf.getPage(i);
            const content = await page.getTextContent();
            if (content.items.length === 0) {
                continue;
            }
            // Eliminate excessive newlines
            // Source: https://github.com/albertcui/pdf-parse/blob/7086fc1cc9058545cdf41dd0646d6ae5832c7107/lib/pdf-parse.js#L16
            let lastY;
            const textItems = [];
            for (const item of content.items) {
                if ("str" in item) {
                    if (lastY === item.transform[5] || !lastY) {
                        textItems.push(item.str);
                    }
                    else {
                        textItems.push(`\n${item.str}`);
                    }
                    // eslint-disable-next-line prefer-destructuring
                    lastY = item.transform[5];
                }
            }
            const text = textItems.join(this.parsedItemSeparator);
            documents.push(new Document({
                pageContent: text,
                metadata: {
                    pdf: {
                        version,
                        info: meta?.info,
                        metadata: meta?.metadata,
                        totalPages: parsedPdf.numPages,
                    },
                    loc: {
                        pageNumber: i,
                    },
                },
            }));
        }
        if (this.splitPages) {
            return documents;
        }
        if (documents.length === 0) {
            return [];
        }
        return [
            new Document({
                pageContent: formatDocumentsAsString(documents),
                metadata: {
                    pdf: {
                        version,
                        info: meta?.info,
                        metadata: meta?.metadata,
                        totalPages: parsedPdf.numPages,
                    },
                },
            }),
        ];
        return documents;
    }
}
async function PDFLoaderImports() {
    try {
        const { default: mod } = await import("pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js");
        const { getDocument, version } = mod;
        return { getDocument, version };
    }
    catch (e) {
        console.error(e);
        throw new Erreur("Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.");
    }
}
