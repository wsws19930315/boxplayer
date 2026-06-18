# AI Agent Actions — Design Spec

**Date:** 2026-06-18
**Status:** approved
**Scope:** Import share, download files, file organization (duplicates, storage analysis, categorization, batch move/delete)

## 1. Overview

Extend the AI search agent with action tools beyond search. The AI can now execute side effects — import share links, trigger downloads, analyze storage, find duplicates, categorize files, and perform batch move/delete. All destructive actions require user confirmation before execution.

## 2. New Part Types

```ts
// ── Share import ──
| { type: 'tool-importShare'
    state: 'parsing' | 'listing' | 'saving' | 'done' | 'error'
    input?: { url: string; password: string }
    output?: { shareName: string; fileCount: number; savedCount: number; platform: string }
    error?: string }

// ── Download ──
| { type: 'tool-downloadFiles'
    state: 'running' | 'done' | 'error'
    input?: { files: { name: string; fileId: string; driveId: string; userId: string }[] }
    output?: { total: number; success: number }
    error?: string }

// ── Duplicates ──
| { type: 'tool-findDuplicates'
    state: 'scanning' | 'done' | 'error'
    output?: { totalFiles: number; groups: { name: string; size: number; files: FileResult[] }[] }
    error?: string }

// ── Storage analysis ──
| { type: 'tool-analyzeStorage'
    state: 'scanning' | 'done' | 'error'
    output?: { drives: { name: string; totalSize: number; fileCount: number; topLarge: FileResult[] }[]; oldestFiles: FileResult[]; unusedFiles: FileResult[] }
    error?: string }

// ── Categorization ──
| { type: 'tool-categorizeFiles'
    state: 'planning' | 'done' | 'error'
    output?: { categories: { name: string; pattern: string; fileCount: number; totalSize: number }[] }
    error?: string }

// ── Batch move/delete (shared confirm→run pattern) ──
| { type: 'tool-moveFiles' | 'tool-deleteFiles'
    state: 'confirm' | 'running' | 'done' | 'error'
    input?: { files: { name: string; fileId: string; driveId: string; userId: string }[]; targetDir?: string }
    output?: { total: number; success: number; failed: number }
    error?: string }
```

## 3. New AI Tools

### 3.1 `importShare`
- **Input:** `url` (share link), `password` (optional extraction code)
- **Flow:** parse URL → detect platform → get share token → list files → save all files to user's default drive root
- **Platforms:** Aliyun (`aliyundrive.com/s/`, `alipan.com/s/`), Quark (`pan.quark.cn/s/`)
- **APIs:** `AliShare.ApiGetShareToken` / `apiQuarkShareToken` → `AliShare.ApiSaveShareFilesBatch` / `apiQuarkSaveShareFilesBatch`
- **User ID / Drive ID** derived from the first logged-in account of the matching platform
- Unsupported platforms return error in part state
- Downloads appear in the app's download page automatically (DownDAL → DowningStore)

### 3.2 `downloadFiles`
- **Input:** file list `{ name, fileId, driveId, userId }[]`
- **Flow:** construct `IAliGetFileModel[]` → call `DownDAL.aAddDownload(fileList, '', false)`
- **Result:** success/failed count returned to AI
- Downloads visible in the app's download page (existing DowningStore integration)

### 3.3 `findDuplicates`
- **Input:** none (scans all logged-in drives)
- **Flow:** call `searchAllDrives('')` with empty keyword to get all files, then group by `(name, size)` pairs where count > 1
- **Output:** duplicate groups with file references so user can navigate to each file
- Limit to top 20 groups to avoid overwhelming output

### 3.4 `analyzeStorage`
- **Input:** none
- **Flow:** gather all files via `searchAllDrives`, aggregate by drive → total size + count, extract top 10 largest files, oldest 10 files, files not modified in 6+ months
- **Output:** per-drive stats + top/old/unused lists
- Uses `humanSize` format

### 3.5 `categorizeFiles`
- **Input:** none
- **Flow:** scan all files, map extensions to categories (video: mp4/mkv/avi…, document: pdf/docx/txt…, audio: mp3/flac…, image: jpg/png…, archive: zip/rar…, other), suggest target directory names
- **Output:** category breakdown with file counts and total sizes
- Does NOT execute moves — only produces a plan. User can then ask AI to move specific categories.

### 3.6 `moveFiles` (requires confirmation)
- **Input:** files + target directory
- **State machine:** `confirm` → user clicks "确认移动" → `running` → `done`/`error`
- Calls `AliFileCmd.ApiMoveBatch(user_id, drive_id, file_idList, to_drive_id, to_parent_file_id)`
- Files must be from the same drive (cross-drive moves not supported by backend)

### 3.7 `deleteFiles` (requires confirmation)
- **Input:** files
- **State machine:** `confirm` → user clicks "确认删除" → `running` → `done`/`error`
- Calls `AliFileCmd.ApiDeleteBatch(user_id, drive_id, file_idList)`
- Moves to trash (not permanent delete)

## 4. New Vue Components

### 4.1 `ImportShareCard.vue`
- **States:** parsing (URL icon + spinner) → listing (spinner + "列出分享文件...") → saving (progress "转存中 3/12...") → done (success summary: share name, platform badge, file count) → error (red banner + retry button)
- ~100 lines

### 4.2 `DownloadCard.vue`
- **States:** running → done → error
- Shows file name list, success/failed counts
- ~70 lines

### 4.3 `DuplicateCard.vue`
- Expandable groups: "movie.mkv — 1.2 GB — 3 copies"
- Each copy shows: file name, drive label, path snippet
- "全选" / "取消全选" per group
- "删除选中" button at bottom → triggers AI `deleteFiles` tool
- Selection tracked via local reactive state
- ~120 lines

### 4.4 `StorageCard.vue`
- Per-drive stat cards: name, total size, file count, horizontal bar chart (CSS)
- "TOP 10 大文件" collapsible list (file name, size, drive)
- "长期未访问" collapsible list
- ~100 lines

### 4.5 `OrganizeCard.vue`
- Table: category name | file count | total size | suggested target folder
- "按此方案整理" button → user clicks → AI executes moveFiles
- ~80 lines

### 4.6 `BatchActionCard.vue`
- Shared component for move/delete confirmation
- `confirm` state: file list preview (scrollable, max 10 visible + "…还有 N 个"), action description, "确认" / "取消" buttons
- `running` state: progress bar + "正在执行..."
- `done` state: success N / failed M summary
- `error` state: error message + retry
- ~100 lines

## 5. Safety Rules

- `deleteFiles` and `moveFiles` MUST have `state: 'confirm'` before execution
- The AI tool handler emits the confirm state and returns. The frontend renders the confirmation card.
- Only when the user clicks "确认" does the frontend call `executeConfirmAction(messageId, partIndex)` which re-enters the tool with `confirmed: true`.
- AI must NEVER call delete/move without prior user confirmation (enforced by system prompt).

## 6. Files Changed

| File | Action |
|------|--------|
| `src/layout/aisearch/types.ts` | +7 part interfaces |
| `src/layout/aisearch/useAISearchChat.ts` | +250 lines (7 tools), confirmation flow helpers |
| `src/layout/aisearch/ImportShareCard.vue` | New |
| `src/layout/aisearch/DownloadCard.vue` | New |
| `src/layout/aisearch/DuplicateCard.vue` | New |
| `src/layout/aisearch/StorageCard.vue` | New |
| `src/layout/aisearch/OrganizeCard.vue` | New |
| `src/layout/aisearch/BatchActionCard.vue` | New |
| `src/layout/AISearchAgent.vue` | +6 part rendering branches, confirm action handler |
