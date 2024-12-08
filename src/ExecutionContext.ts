export class ExecutionContext {
  private refs: Record<string, any>;

  constructor() {
    this.refs = {};
  }

  setRef<T>(key: string, value: T): void {
    this.refs[key] = value;
  }

  getRef<T>(key: string): T | undefined {
    return this.refs[key];
  }
}
