import { Document } from "@langchain/core/documents";
import { BufferLoader } from "./buffer.js";
/**
 * A class that extends the `BufferLoader` class. It represents a document
 * loader that loads documents from DOCX files.
 */
export class DocxLoader extends BufferLoader {
    constructor(filePathOrBlob) {
        super(filePathOrBlob);
    }
    /**
     * A method that takes a `raw` buffer and `metadata` as parameters and
     * returns a promise that resolves to an array of `Document` instances. It
     * uses the `extractRawText` function from the `mammoth` module to extract
     * the raw text content from the buffer. If the extracted text content is
     * empty, it returns an empty array. Otherwise, it creates a new
     * `Document` instance with the extracted text content and the provided
     * metadata, and returns it as an array.
     * @param raw The raw buffer from which to extract text content.
     * @param metadata The metadata to be associated with the created `Document` instance.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    async parse(raw, metadata) {
        const { extractRawText } = await DocxLoaderImports();
        const docx = await extractRawText({
            buffer: raw,
        });
        if (!docx.value)
            return [];
        return [
            new Document({
                pageContent: docx.value,
                metadata,
            }),
        ];
    }
}
async function DocxLoaderImports() {
    try {
        const { extractRawText } = await import("mammoth");
        return { extractRawText };
    }
    catch (e) {
        console.error(e);
        throw new Erreur("Failed to load mammoth. Please install it with eg. `npm install mammoth`.");
    }
}
