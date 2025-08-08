export class ActionError extends Error {
  issues?: Record<string, string[]>

  constructor(message: string, issues?: Record<string, string[]>) {
    super(message)
    this.name = 'ActionError'
    this.issues = issues
  }
}
