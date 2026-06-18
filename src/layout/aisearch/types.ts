import type { GlobalSearchResult } from '../../utils/globalSearch'

export interface FileResult {
  name: string
  ext: string
  size: number
  isDir: boolean
  provider: string
  providerName: string
  driveId: string
  fileId: string
  parentFileId: string
  userId: string
  source: string
}

export interface LinkResult {
  type: string
  url: string
  note: string
  password: string
}

export type PartState = 'pending' | 'running' | 'done' | 'error'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ReasoningPart {
  type: 'reasoning'
  text: string
}

export interface ClarificationPart {
  type: 'clarification'
  question: string
  options: string[]
}

export interface SummaryPart {
  type: 'summary'
  text: string
  followups: string[]
}

export interface ToolSearchMyFilesPart {
  type: 'tool-searchMyFiles'
  state: PartState
  input?: { keyword: string }
  output?: { total: number; files: FileResult[] }
  error?: string
}

export interface ToolSearchPanHubPart {
  type: 'tool-searchPanHub'
  state: PartState
  input?: { keyword: string }
  output?: { total: number; links: LinkResult[] }
  error?: string
}

export type MessagePart =
  | TextPart
  | ReasoningPart
  | ClarificationPart
  | SummaryPart
  | ToolSearchMyFilesPart
  | ToolSearchPanHubPart

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  parts: MessagePart[]
}
