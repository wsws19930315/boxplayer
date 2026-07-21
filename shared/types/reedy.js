export const RRF_K = 60;
export const RRF_FETCH_MULTIPLIER = 3;
export const MAX_QUERY_CHARS = 500;
export const MAX_TOP_K = 5;
export const PER_TURN_BUDGET_MS = 10_000;
export const RESULT_SIZE_CAP_CHARS = 6_000;
export const DEFAULT_EMBEDDING_TIMEOUT_MS = 5_000;
export const DEFAULT_BATCH_SIZE = 16;
export const OLLAMA_BATCH_SIZE = 4;
export const CHUNK_OPTIONS = {
    maxChunkSize: 500,
    minChunkSize: 100,
    overlapSize: 50,
    breakSearchRange: 50
};
export const MEMORY_CONSOLIDATION_THRESHOLD = 6;
export const MEMORY_MAX_PER_RUN = 3;
export const PROMPT_SAFETY_MARGIN_TOKENS = 256;
export const CHAR_PER_TOKEN = 4;
