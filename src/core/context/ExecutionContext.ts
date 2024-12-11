export class ExecutionContext {
  private refs: Record<string, any> = {};

  setRef(key: string, value: any): void {
    this.refs[key] = value;
  }

  getRef(key: string): any {
    return this.refs[key];
  }
}
