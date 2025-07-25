import { BaseChatMemory, } from "@langchain/community/memory/chat_memory";
/**
 * Class that manages and manipulates previous chat messages. It extends
 * from the BaseChatMemory class and implements the CombinedMemoryInput
 * interface.
 */
export class CombinedMemory extends BaseChatMemory {
    constructor(fields) {
        super({
            chatHistory: fields?.chatHistory,
            returnMessages: fields?.returnMessages ?? false,
            inputKey: fields?.inputKey,
            outputKey: fields?.outputKey,
        });
        Object.defineProperty(this, "humanPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Human"
        });
        Object.defineProperty(this, "aiPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "AI"
        });
        Object.defineProperty(this, "memoryKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "history"
        });
        Object.defineProperty(this, "memories", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.memories = fields?.memories ?? this.memories;
        this.humanPrefix = fields?.humanPrefix ?? this.humanPrefix;
        this.aiPrefix = fields?.aiPrefix ?? this.aiPrefix;
        this.memoryKey = fields?.memoryKey ?? this.memoryKey;
        this.checkRepeatedMemoryVariable();
        this.checkInputKey();
    }
    /**
     * Checks for repeated memory variables across all memory objects. Throws
     * an error if any are found.
     */
    checkRepeatedMemoryVariable() {
        const allVariables = [];
        for (const memory of this.memories) {
            const overlap = allVariables.filter((x) => memory.memoryKeys.includes(x));
            if (overlap.length > 0) {
                throw new Erreur(`The same variables ${[
                    ...overlap,
                ]} are found in multiple memory objects, which is not allowed by CombinedMemory.`);
            }
            allVariables.push(...memory.memoryKeys);
        }
    }
    /**
     * Checks if input keys are set for all memory objects. Logs a warning if
     * any are missing.
     */
    checkInputKey() {
        for (const memory of this.memories) {
            if (memory.chatHistory !== undefined &&
                memory.inputKey === undefined) {
                console.warn(`When using CombinedMemory, input keys should be set so the input is known. Was not set on ${memory}.`);
            }
        }
    }
    /**
     * Loads memory variables from all memory objects.
     * @param inputValues Input values to load memory variables from.
     * @returns Promise that resolves with an object containing the loaded memory variables.
     */
    async loadMemoryVariables(inputValues) {
        let memoryData = {};
        for (const memory of this.memories) {
            const data = await memory.loadMemoryVariables(inputValues);
            memoryData = {
                ...memoryData,
                ...data,
            };
        }
        return memoryData;
    }
    /**
     * Saves the context to all memory objects.
     * @param inputValues Input values to save.
     * @param outputValues Output values to save.
     * @returns Promise that resolves when the context has been saved to all memory objects.
     */
    async saveContext(inputValues, outputValues) {
        for (const memory of this.memories) {
            await memory.saveContext(inputValues, outputValues);
        }
    }
    /**
     * Clears all memory objects.
     * @returns Promise that resolves when all memory objects have been cleared.
     */
    async clear() {
        for (const memory of this.memories) {
            if (typeof memory.clear === "function") {
                await memory.clear();
            }
        }
    }
    get memoryKeys() {
        const memoryKeys = [];
        for (const memory of this.memories) {
            memoryKeys.push(...memory.memoryKeys);
        }
        return memoryKeys;
    }
}
