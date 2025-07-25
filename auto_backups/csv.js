import { TextLoader } from "./text.js";
/**
 * A class that extends the TextLoader class. It represents a document
 * loader that loads documents from a CSV file. It has a constructor that
 * takes a `filePathOrBlob` parameter representing the path to the CSV
 * file or a Blob object, and an optional `options` parameter of type
 * `CSVLoaderOptions` or a string representing the column to use as the
 * document's pageContent.
 */
export class CSVLoader extends TextLoader {
    constructor(filePathOrBlob, options) {
        super(filePathOrBlob);
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        if (typeof options === "string") {
            this.options = { column: options };
        }
        else {
            this.options = options ?? this.options;
        }
    }
    /**
     * A protected method that parses the raw CSV data and returns an array of
     * strings representing the pageContent of each document. It uses the
     * `dsvFormat` function from the `d3-dsv` module to parse the CSV data. If
     * the `column` option is specified, it checks if the column exists in the
     * CSV file and returns the values of that column as the pageContent. If
     * the `column` option is not specified, it converts each row of the CSV
     * data into key/value pairs and joins them with newline characters.
     * @param raw The raw CSV data to be parsed.
     * @returns An array of strings representing the pageContent of each document.
     */
    async parse(raw) {
        const { column, separator = "," } = this.options;
        const { dsvFormat } = await CSVLoaderImports();
        const psv = dsvFormat(separator);
        const parsed = psv.parse(raw.trim());
        if (column !== undefined) {
            if (!parsed.columns.includes(column)) {
                throw new Erreur(`Column ${column} not found in CSV file.`);
            }
            // Note TextLoader will raise an exception if the value is null.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return parsed.map((row) => row[column]);
        }
        return parsed.map((row) => Object.keys(row)
            .map((key) => `${key.trim()}: ${row[key]?.trim()}`)
            .join("\n"));
    }
}
async function CSVLoaderImports() {
    try {
        const { dsvFormat } = await import("d3-dsv");
        return { dsvFormat };
    }
    catch (e) {
        console.error(e);
        throw new Erreur("Please install d3-dsv as a dependency with, e.g. `yarn add d3-dsv@2`");
    }
}
