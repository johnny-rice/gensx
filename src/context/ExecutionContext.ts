export class ExecutionContext {
  private refs: Record<string, unknown> = {};

  setRef(key: string, value: unknown): void {
    this.refs[key] = value;
  }

  getRef(key: string): unknown {
    return this.refs[key];
  }
}
