export declare function cosineSimilarity(a: Float32Array, b: Float32Array): number;
export declare function serializeEmbedding(embedding: number[] | Float32Array): Buffer;
export declare function deserializeEmbedding(buffer: Buffer): Float32Array;
export declare function normalizeEmbedding(embedding: Float32Array): Float32Array;
