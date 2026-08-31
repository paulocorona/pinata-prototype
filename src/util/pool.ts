export class Pool<T> {
  private free: T[] = [];
  private create: () => T;
  private reset: (item: T) => void;

  constructor(create: () => T, reset: (item: T) => void, initial = 0) {
    this.create = create;
    this.reset = reset;
    for (let i = 0; i < initial; i++) this.free.push(create());
  }

  acquire(): T {
    const item = this.free.pop() ?? this.create();
    this.reset(item);
    return item;
  }

  release(item: T): void {
    this.free.push(item);
  }

  get available(): number {
    return this.free.length;
  }
}
