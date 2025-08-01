import { describe, expect, it, vi } from "vitest";

import { Wrap, wrap } from "../src/wrap.js";

describe("wrap", () => {
  it("wraps a class instance", async () => {
    class Calculator {
      async add(input: { a: number; b: number }) {
        return Promise.resolve(input.a + input.b);
      }
      async subtract(input: { a: number; b: number }) {
        return Promise.resolve(input.a - input.b);
      }
    }

    const calc = new Calculator();
    const wrappedCalc = wrap(calc);

    const addResult = await wrappedCalc.add({ a: 10, b: 5 });
    expect(addResult).toBe(15);

    const subtractResult = await wrappedCalc.subtract({ a: 10, b: 5 });
    expect(subtractResult).toBe(5);
  });

  it("wraps nested objects", async () => {
    const api = {
      users: {
        get: (input: { id: string }) => Promise.resolve(`User ${input.id}`),
        create: (input: { name: string }) =>
          Promise.resolve(`Created ${input.name}`),
      },
      posts: {
        list: (input: { limit: number }) =>
          Promise.resolve(`Listed ${input.limit} posts`),
      },
    };

    const wrappedApi = wrap(api);

    const user = await wrappedApi.users.get({ id: "123" });
    expect(user).toBe("User 123");

    const newUser = await wrappedApi.users.create({ name: "John" });
    expect(newUser).toBe("Created John");

    const posts = await wrappedApi.posts.list({ limit: 10 });
    expect(posts).toBe("Listed 10 posts");
  });

  it("handles custom prefixes", async () => {
    const api = {
      getData: (input: { id: string }) => Promise.resolve(`Data ${input.id}`),
    };

    const wrappedApi = wrap(api, { prefix: "MyAPI" });

    const result = await wrappedApi.getData({ id: "123" });
    expect(result).toBe("Data 123");
  });

  it("preserves arrays and dates", () => {
    const obj = {
      array: [1, 2, 3],
      date: new Date("2024-01-01"),
    };

    const wrapped = wrap(obj);
    expect(wrapped.array).toEqual([1, 2, 3]);
    expect(wrapped.date).toBeInstanceOf(Date);
  });

  it("maintains this context in class methods", async () => {
    class Counter {
      private count = 0;

      increment(_input: {}) {
        this.count++;
        return Promise.resolve(this.count);
      }

      getCount(_input: {}) {
        return Promise.resolve(this.count);
      }
    }

    const counter = new Counter();
    const wrappedCounter = wrap(counter);

    const count1 = await wrappedCounter.increment({});
    expect(count1).toBe(1);

    const count2 = await wrappedCounter.increment({});
    expect(count2).toBe(2);

    const finalCount = await wrappedCounter.getCount({});
    expect(finalCount).toBe(2);
  });
});

describe("Wrap decorator", () => {
  it("wraps class methods into components", async () => {
    @Wrap()
    class Calculator {
      add(input: { a: number; b: number }) {
        return Promise.resolve(input.a + input.b);
      }
      subtract(input: { a: number; b: number }) {
        return Promise.resolve(input.a - input.b);
      }
    }

    const calc = new Calculator();
    const addResult = await calc.add({ a: 10, b: 5 });
    expect(addResult).toBe(15);

    const subtractResult = await calc.subtract({ a: 10, b: 5 });
    expect(subtractResult).toBe(5);
  });

  it("handles custom prefixes", async () => {
    @Wrap({ prefix: "MyAPI" })
    class API {
      getData(input: { id: string }) {
        return Promise.resolve(`Data ${input.id}`);
      }
    }

    const api = new API();
    const result = await api.getData({ id: "123" });
    expect(result).toBe("Data 123");
  });

  it("maintains this context in class methods", async () => {
    @Wrap()
    class Counter {
      private count = 0;

      increment(_input: {}) {
        this.count++;
        return Promise.resolve(this.count);
      }

      getCount(_input: {}) {
        return Promise.resolve(this.count);
      }
    }

    const counter = new Counter();
    const count1 = await counter.increment({});
    expect(count1).toBe(1);

    const count2 = await counter.increment({});
    expect(count2).toBe(2);

    const finalCount = await counter.getCount({});
    expect(finalCount).toBe(2);
  });

  it("preserves class inheritance", async () => {
    class Base {
      baseMethod(input: { value: string }) {
        return Promise.resolve(`Base: ${input.value}`);
      }
    }

    @Wrap()
    class Derived extends Base {
      derivedMethod(input: { value: string }) {
        return Promise.resolve(`Derived: ${input.value}`);
      }
    }

    const derived = new Derived();
    const baseResult = await derived.baseMethod({ value: "test" });
    expect(baseResult).toBe("Base: test");

    const derivedResult = await derived.derivedMethod({ value: "test" });
    expect(derivedResult).toBe("Derived: test");
  });
});

describe("getComponentOpts", () => {
  it("calls getComponentOpts with correct path and arguments", async () => {
    const getComponentOpts = vi.fn((path: string[], _args: unknown) => ({
      metadata: { path },
    }));

    const api = {
      users: {
        get: (input: { id: string }) => Promise.resolve(`User ${input.id}`),
      },
    };

    const wrappedApi = wrap(api, { getComponentOpts });
    await wrappedApi.users.get({ id: "123" });

    expect(getComponentOpts).toHaveBeenCalledWith(
      ["sdk", "users"],
      expect.any(Function),
    );
  });

  it("applies component options from getComponentOpts", async () => {
    const getComponentOpts = vi.fn((_path: string[], _args: unknown) => ({
      metadata: { custom: "value" },
    }));

    const api = {
      getData: (input: { id: string }) => Promise.resolve(`Data ${input.id}`),
    };

    const wrappedApi = wrap(api, { getComponentOpts });
    const result = await wrappedApi.getData({ id: "123" });
    expect(result).toBe("Data 123");
  });

  it("uses prefix in component name but not in path", async () => {
    const getComponentOpts = vi.fn((path: string[], _args: unknown) => ({
      metadata: { path },
    }));

    const api = {
      getData: (input: { id: string }) => Promise.resolve(`Data ${input.id}`),
    };

    const wrappedApi = wrap(api, { prefix: "MyAPI", getComponentOpts });
    await wrappedApi.getData({ id: "123" });

    expect(getComponentOpts).toHaveBeenCalledWith(
      ["sdk"],
      expect.any(Function),
    );
  });

  it("works with class instances", async () => {
    const getComponentOpts = vi.fn((path: string[], _args: unknown) => ({
      metadata: { path },
    }));

    class Calculator {
      add(input: { a: number; b: number }) {
        return Promise.resolve(input.a + input.b);
      }
    }

    const calc = new Calculator();
    const wrappedCalc = wrap(calc, { getComponentOpts });
    await wrappedCalc.add({ a: 1, b: 2 });

    expect(getComponentOpts).toHaveBeenCalledWith(
      ["Calculator"],
      expect.any(Function),
    );
  });
});

describe("type preservation", () => {
  it("preserves non-promise return types", () => {
    class Calculator {
      add(input: { a: number; b: number }): number {
        return input.a + input.b;
      }
    }

    const calc = new Calculator();
    const wrappedCalc = wrap(calc);

    // TypeScript should know this returns a number
    const result: number = wrappedCalc.add({ a: 1, b: 2 });
    expect(result).toBe(3);
  });

  it("preserves promise return types", async () => {
    class AsyncCalculator {
      async add(input: { a: number; b: number }): Promise<number> {
        return Promise.resolve(input.a + input.b);
      }
    }

    const calc = new AsyncCalculator();
    const wrappedCalc = wrap(calc);

    // TypeScript should know this returns a Promise<number>
    const result: Promise<number> = wrappedCalc.add({ a: 1, b: 2 });
    expect(await result).toBe(3);
  });

  it("preserves complex return types", async () => {
    interface User {
      id: string;
      name: string;
    }

    class UserService {
      async getUser(input: { id: string }): Promise<User> {
        return Promise.resolve({ id: input.id, name: "Test User" });
      }

      getUsers(input: { limit: number }): User[] {
        const users: User[] = [];
        for (let i = 0; i < input.limit; i++) {
          users.push({ id: "1", name: "Test User" });
        }
        return users;
      }
    }

    const service = new UserService();
    const wrappedService = wrap(service);

    // TypeScript should know these return types
    const user: Promise<User> = wrappedService.getUser({ id: "1" });
    const users: User[] = wrappedService.getUsers({ limit: 2 });

    expect(await user).toEqual({ id: "1", name: "Test User" });
    expect(users).toHaveLength(2);
  });

  it("preserves nested object types", async () => {
    interface Config {
      api: {
        baseUrl: string;
        timeout: number;
      };
    }

    class ConfigService {
      getConfig(_input: { version: string }): Config {
        return {
          api: {
            baseUrl: "https://api.example.com",
            timeout: 5000,
          },
        };
      }

      async getAsyncConfig(_input: { version: string }): Promise<Config> {
        return Promise.resolve({
          api: {
            baseUrl: "https://api.example.com",
            timeout: 5000,
          },
        });
      }
    }

    const service = new ConfigService();
    const wrappedService = wrap(service);

    // TypeScript should know these return types
    const config: Config = wrappedService.getConfig({ version: "1.0" });
    const asyncConfig: Promise<Config> = wrappedService.getAsyncConfig({
      version: "1.0",
    });

    expect(config).toEqual({
      api: {
        baseUrl: "https://api.example.com",
        timeout: 5000,
      },
    });
    expect(await asyncConfig).toEqual({
      api: {
        baseUrl: "https://api.example.com",
        timeout: 5000,
      },
    });
  });

  it("preserves void return types", async () => {
    class Logger {
      log(input: { message: string }): void {
        console.info(input.message);
      }

      async logAsync(input: { message: string }): Promise<void> {
        await Promise.resolve();
        console.info(input.message);
      }
    }

    const logger = new Logger();
    const wrappedLogger = wrap(logger);

    // TypeScript should know these return types
    wrappedLogger.log({ message: "test" });
    const asyncResult: Promise<void> = wrappedLogger.logAsync({
      message: "test",
    });
    await asyncResult;
  });

  it("handles methods with no parameters", async () => {
    class DataProvider {
      private data = "test data";

      getData() {
        return Promise.resolve(this.data);
      }

      getTimestamp() {
        return Promise.resolve(Date.now());
      }

      syncMethod() {
        return "sync result";
      }
    }

    const provider = new DataProvider();
    const wrappedProvider = wrap(provider);

    const data = await wrappedProvider.getData();
    expect(data).toBe("test data");

    const timestamp = await wrappedProvider.getTimestamp();
    expect(typeof timestamp).toBe("number");

    const syncResult = wrappedProvider.syncMethod();
    expect(syncResult).toBe("sync result");
  });

  it("handles objects with no-parameter functions", async () => {
    const utils = {
      getRandom: () => Math.random(),
      getConstant: () => Promise.resolve(42),
      helpers: {
        getVersion: () => "1.0.0",
        getEnv: () => Promise.resolve("development"),
      },
    };

    const wrappedUtils = wrap(utils);

    const random = wrappedUtils.getRandom();
    expect(typeof random).toBe("number");

    const constant = await wrappedUtils.getConstant();
    expect(constant).toBe(42);

    const version = wrappedUtils.helpers.getVersion();
    expect(version).toBe("1.0.0");

    const env = await wrappedUtils.helpers.getEnv();
    expect(env).toBe("development");
  });
});
