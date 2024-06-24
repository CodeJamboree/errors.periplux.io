
export interface LogData {
  id: number,
  scope: string,
  first_at: number,
  last_at: number,
  type: string,
  message: string,
  path: string,
  line: number,
  count: number,
  message_hash?: string,
  path_hash?: string,
  scope_hash?: string
}