export class ExecutionContext<TRefs extends Record<string, any>> {
  private refs: Partial<TRefs> = {};

  setRef<K extends keyof TRefs>(key: K, value: TRefs[K]): void {
    this.refs[key] = value;
  }

  getRef<K extends keyof TRefs>(key: K): TRefs[K] | undefined {
    return this.refs[key];
  }
}
