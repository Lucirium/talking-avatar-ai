interface Neo4jGraphConfig {
    url: string;
    username: string;
    password: string;
    database?: string;
    timeoutMs?: number;
}
interface StructuredSchema {
    nodeProps: {
        [key: NodeType["labels"]]: NodeType["properties"];
    };
    relProps: {
        [key: RelType["type"]]: RelType["properties"];
    };
    relationships: PathType[];
}
type NodeType = {
    labels: string;
    properties: {
        property: string;
        type: string;
    }[];
};
type RelType = {
    type: string;
    properties: {
        property: string;
        type: string;
    }[];
};
type PathType = {
    start: string;
    type: string;
    end: string;
};
/**
 * @security *Security note*: Make sure that the database connection uses credentials
 * that are narrowly-scoped to only include necessary permissions.
 * Failure to do so may result in data corruption or loss, since the calling
 * code may attempt commands that would result in deletion, mutation
 * of data if appropriately prompted or reading sensitive data if such
 * data is present in the database.
 * The best way to guard against such negative outcomes is to (as appropriate)
 * limit the permissions granted to the credentials used with this tool.
 * For example, creating read only users for the database is a good way to
 * ensure that the calling code cannot mutate or delete data.
 *
 * @link See https://js.langchain.com/docs/security for more information.
 */
export declare class Neo4jGraph {
    private driver;
    private database;
    private timeoutMs;
    protected schema: string;
    protected structuredSchema: StructuredSchema;
    constructor({ url, username, password, database, timeoutMs, }: Neo4jGraphConfig);
    static initialize(config: Neo4jGraphConfig): Promise<Neo4jGraph>;
    getSchema(): string;
    getStructuredSchema(): StructuredSchema;
    query(query: string, params?: any): Promise<any[] | undefined>;
    verifyConnectivity(): Promise<void>;
    refreshSchema(): Promise<void>;
    close(): Promise<void>;
}
export {};
