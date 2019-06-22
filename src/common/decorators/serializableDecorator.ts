export function serializableDecorator<T extends {new(...args: any[]): {}}>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      for (const propertyName in this) {
        if (!propertyName.startsWith('_')) continue;
        Object.defineProperty(this, propertyName, {enumerable: false});
      }
    }
  };
}
