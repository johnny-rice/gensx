/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */

import { Readable } from "node:stream";

import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";

import { RemoteBlobStorage } from "../../src/blob/remote.js";
import {
  BlobConflictError,
  BlobError,
  BlobInternalError,
  BlobNetworkError,
} from "../../src/index.js";

suite("RemoteBlobStorage", () => {
  // Save original environment
  const originalEnv = { ...process.env };
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Setup mock environment variables
    process.env.GENSX_API_KEY = "test-api-key";
    process.env.GENSX_ORG = "test-org";

    // Reset and setup fetch mock
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(async () => {
    // Restore original environment
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  test("should initialize with environment variables", () => {
    expect(
      () => new RemoteBlobStorage("test-project", "test-environment"),
    ).not.toThrow();
  });

  test("should throw if API key is missing", () => {
    delete process.env.GENSX_API_KEY;
    expect(
      () => new RemoteBlobStorage("test-project", "test-environment"),
    ).toThrow("GENSX_API_KEY");
  });

  test("should throw if organization ID is missing", () => {
    delete process.env.GENSX_ORG;
    expect(
      () => new RemoteBlobStorage("test-project", "test-environment"),
    ).toThrow("Organization must");
  });

  test("should get JSON from a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockData = { foo: "bar" };
    const mockStringContent = JSON.stringify(mockData);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: mockStringContent,
        etag: "mock-etag",
      }),
    });

    const blob = storage.getBlob<typeof mockData>("test-key");
    const result = await blob.getJSON();

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should parse JSON string content from API response", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockData = { messages: [{ role: "user", content: "Hello" }] };
    const mockStringContent = JSON.stringify(mockData);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: mockStringContent,
        etag: "mock-etag",
      }),
    });

    const blob = storage.getBlob<typeof mockData>("test-key");
    const result = await blob.getJSON();

    // Ensure we got a result
    expect(result).not.toBeNull();
    if (!result) return; // TypeScript guard

    expect(result).toEqual(mockData);
    expect(result).not.toBe(mockStringContent); // Ensure it's not still a string
    expect(typeof result).toBe("object");
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content).toBe("Hello");
  });

  test("should handle non-existent blobs", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const blob = storage.getBlob("non-existent");
    const result = await blob.getJSON();

    expect(result).toBeNull();
  });

  test("should put JSON to a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = { foo: "bar" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
      body: JSON.stringify({
        content: JSON.stringify(data),
        contentType: "application/json",
        etag: "mock-etag",
      }),
    });

    const blob = storage.getBlob<typeof data>("test-key");
    const result = await blob.putJSON(data);

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    // Verify the body contains the serialized content
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: JSON.stringify(data),
      contentType: "application/json",
    });
  });

  test("should list blobs with prefix", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockBlobs = [
      { key: "key1", lastModified: "2024-01-01T00:00:00Z", size: 100 },
      { key: "key2", lastModified: "2024-01-01T00:00:00Z", size: 200 },
      { key: "key3", lastModified: "2024-01-01T00:00:00Z", size: 300 },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: mockBlobs,
        nextCursor: null,
      }),
    });

    const result = await storage.listBlobs({ prefix: "test-prefix" });

    expect(result.blobs).toEqual(mockBlobs);
    expect(result.nextCursor).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?prefix=test-prefix&limit=100",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should handle pagination with limit", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    // Mock first page response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: [
          { key: "key1", lastModified: "2024-01-01T00:00:00Z", size: 100 },
          { key: "key2", lastModified: "2024-01-01T00:00:00Z", size: 200 },
        ],
        nextCursor: "page1cursor",
      }),
    });

    const firstPage = await storage.listBlobs({ limit: 2 });
    expect(firstPage.blobs).toHaveLength(2);
    expect(firstPage.blobs[0].key).toBe("key1");
    expect(firstPage.blobs[1].key).toBe("key2");
    expect(firstPage.nextCursor).toBe("page1cursor");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?limit=2",
      expect.any(Object),
    );

    // Mock second page response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: [
          { key: "key3", lastModified: "2024-01-01T00:00:00Z", size: 300 },
        ],
        nextCursor: null,
      }),
    });

    const secondPage = await storage.listBlobs({
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });
    expect(secondPage.blobs).toHaveLength(1);
    expect(secondPage.blobs[0].key).toBe("key3");
    expect(secondPage.nextCursor).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?limit=2&cursor=page1cursor",
      expect.any(Object),
    );
  });

  test("should handle pagination with prefix", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    // Mock first page response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: [
          {
            key: "prefix/key1",
            lastModified: "2024-01-01T00:00:00Z",
            size: 100,
          },
          {
            key: "prefix/key2",
            lastModified: "2024-01-01T00:00:00Z",
            size: 200,
          },
        ],
        nextCursor: "page1cursor",
      }),
    });

    const firstPage = await storage.listBlobs({
      prefix: "prefix",
      limit: 2,
    });
    expect(firstPage.blobs).toHaveLength(2);
    expect(firstPage.blobs[0].key).toBe("prefix/key1");
    expect(firstPage.blobs[1].key).toBe("prefix/key2");
    expect(firstPage.nextCursor).toBe("page1cursor");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?prefix=prefix&limit=2",
      expect.any(Object),
    );

    // Mock second page response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: [
          {
            key: "prefix/key3",
            lastModified: "2024-01-01T00:00:00Z",
            size: 300,
          },
        ],
        nextCursor: null,
      }),
    });

    const secondPage = await storage.listBlobs({
      prefix: "prefix",
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });
    expect(secondPage.blobs).toHaveLength(1);
    expect(secondPage.blobs[0].key).toBe("prefix/key3");
    expect(secondPage.nextCursor).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?prefix=prefix&limit=2&cursor=page1cursor",
      expect.any(Object),
    );
  });

  test("should handle empty results with pagination", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: [],
        nextCursor: null,
      }),
    });

    const result = await storage.listBlobs({ limit: 10 });
    expect(result.blobs).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  test("should handle default limit in pagination", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    // Generate 100 mock blobs
    const mockBlobs = Array.from({ length: 100 }, (_, i) => ({
      key: `key${i + 1}`,
      lastModified: "2024-01-01T00:00:00Z",
      size: 100 * (i + 1),
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: mockBlobs,
        nextCursor: "nextpage",
      }),
    });

    const result = await storage.listBlobs();
    expect(result.blobs).toHaveLength(100); // Default limit
    expect(result.nextCursor).toBe("nextpage");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?limit=100",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should delete a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const blob = storage.getBlob("test-key");
    await blob.delete();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should check if a blob exists", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const blob = storage.getBlob("exists-key");
    const exists = await blob.exists();

    expect(exists).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/exists-key",
      expect.objectContaining({
        method: "HEAD",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should put string to a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = "Hello, remote world!";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
    });

    const blob = storage.getBlob<string>("string-key");
    const result = await blob.putString(data);

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/string-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    // Verify the body contains the string content
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: data,
      contentType: "text/plain",
    });
  });

  test("should get string from a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockData = "Hello, world!";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: mockData,
        etag: "mock-etag",
      }),
    });

    const blob = storage.getBlob<string>("test-key");
    const result = await blob.getString();

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should get raw data from a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockData = Buffer.from("Hello, world!");
    const base64Data = mockData.toString("base64");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        content: base64Data,
        contentType: "application/octet-stream",
        etag: "mock-etag",
        lastModified: "2024-01-01T00:00:00Z",
        size: mockData.length,
        metadata: { isBase64: "true" },
      }),
    });

    const blob = storage.getBlob<Buffer>("test-key");
    const result = await blob.getRaw();

    expect(result).toEqual({
      content: mockData,
      contentType: "application/octet-stream",
      etag: "mock-etag",
      lastModified: new Date("2024-01-01T00:00:00Z"),
      size: mockData.length,
      metadata: {},
    });
  });

  test("should get stream from a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const mockData = "Hello, world!";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: Readable.from(mockData),
    });

    const blob = storage.getBlob<Readable>("test-key");
    const stream = await blob.getStream();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const result = Buffer.concat(chunks).toString();

    expect(result).toEqual(mockData);
  });

  test("should put raw data to a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = Buffer.from("Hello, world!");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
    });

    const blob = storage.getBlob<Buffer>("test-key");
    const result = await blob.putRaw(data, {
      contentType: "application/octet-stream",
      metadata: { test: "value" },
    });

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: data.toString("base64"),
      contentType: "application/octet-stream",
      metadata: {
        test: "value",
        isBase64: "true",
      },
    });
  });

  test("should put stream to a blob", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = "Hello, world!";
    const stream = Readable.from(data);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
    });

    const blob = storage.getBlob<Readable>("test-key");
    const result = await blob.putStream(stream, {
      contentType: "text/plain",
      metadata: { test: "value" },
    });

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: Buffer.from(data).toString("base64"),
      contentType: "text/plain",
      metadata: {
        test: "value",
        isBase64: "true",
      },
    });
  });

  test("should get blob metadata", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const _mockData = { foo: "bar" };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          switch (name) {
            case "x-blob-meta-content-type":
              return "application/json";
            case "etag":
              return "mock-etag";
            case "x-blob-meta-test":
              return "value";
            default:
              return null;
          }
        },
        [Symbol.iterator]: function* () {
          yield ["x-blob-meta-content-type", "application/json"];
          yield ["etag", "mock-etag"];
          yield ["x-blob-meta-test", "value"];
        },
      },
    });

    const blob = storage.getBlob<typeof _mockData>("test-key");
    const metadata = await blob.getMetadata();

    expect(metadata).toEqual({
      contentType: "application/json",
      etag: "mock-etag",
      test: "value",
    });
  });

  test("should update blob metadata", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");

    mockFetch.mockResolvedValueOnce({
      ok: true,
    });

    const blob = storage.getBlob("test-key");
    await blob.updateMetadata({ test: "value" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          metadata: { test: "value" },
        }),
      }),
    );
  });

  suite("Error Handling", () => {
    test("should handle HTTP 404 errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("not-found");

      const result = await blob.getJSON();
      expect(result).toBeNull();
    });

    test("should handle API error responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({ error: "Bad Request" }),
      });

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("api-error");

      try {
        await blob.getJSON();
        // Should have thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BlobInternalError);
        expect((err as BlobError).code).toBe("INTERNAL_ERROR");
        expect((err as BlobError).message).toContain("Bad Request");
      }
    });

    test("should handle HTTP error status codes", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Internal Server Error" }),
      });

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("server-error");

      try {
        await blob.getJSON();
        // Should have thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BlobInternalError);
        expect((err as BlobError).code).toBe("INTERNAL_ERROR");
      }
    });

    test("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("network-error");

      try {
        await blob.getJSON();
        // Should have thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BlobNetworkError);
        expect((err as BlobError).code).toBe("NETWORK_ERROR");
        expect((err as BlobError).message).toContain("Network failure");
      }
    });

    test("should throw CONFLICT error when etag doesn't match", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 412, // Precondition Failed status code
        statusText: "Precondition Failed",
      });

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("etag-mismatch");
      const outdatedEtag = "outdated-etag-value";

      try {
        await blob.putString("test data", { etag: outdatedEtag });
        // Should have thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BlobConflictError);
        expect((err as BlobError).code).toBe("CONFLICT");
        expect((err as BlobError).message).toContain("ETag mismatch");
      }
    });

    test("should handle missing ETag in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => null, // No ETag
        },
      });

      const storage = new RemoteBlobStorage("test-project", "test-environment");
      const blob = storage.getBlob<string>("no-etag");

      try {
        await blob.putString("test");
        // Should have thrown
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(BlobInternalError);
        expect((err as BlobError).code).toBe("INTERNAL_ERROR");
        expect((err as BlobError).message).toContain("No ETag");
      }
    });
  });

  test("should handle default prefix in listBlobs", async () => {
    const storage = new RemoteBlobStorage(
      "test-project",
      "test-environment",
      "default-prefix",
    );
    const mockBlobs = [
      {
        key: "default-prefix/key1",
        lastModified: "2024-01-01T00:00:00Z",
        size: 100,
      },
      {
        key: "default-prefix/key2",
        lastModified: "2024-01-01T00:00:00Z",
        size: 200,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: mockBlobs,
        nextCursor: null,
      }),
    });

    const result = await storage.listBlobs();

    expect(result.blobs).toEqual([
      { key: "key1", lastModified: "2024-01-01T00:00:00Z", size: 100 },
      { key: "key2", lastModified: "2024-01-01T00:00:00Z", size: 200 },
    ]);
    expect(result.nextCursor).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?prefix=default-prefix&limit=100",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      }),
    );
  });

  test("should combine default prefix with provided prefix in listBlobs", async () => {
    const storage = new RemoteBlobStorage(
      "test-project",
      "test-environment",
      "default-prefix",
    );
    const mockBlobs = [
      {
        key: "default-prefix/sub/key1",
        lastModified: "2024-01-01T00:00:00Z",
        size: 100,
      },
      {
        key: "default-prefix/sub/key2",
        lastModified: "2024-01-01T00:00:00Z",
        size: 200,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        blobs: mockBlobs,
        nextCursor: null,
      }),
    });

    const result = await storage.listBlobs({ prefix: "sub" });

    expect(result.blobs).toEqual([
      { key: "sub/key1", lastModified: "2024-01-01T00:00:00Z", size: 100 },
      { key: "sub/key2", lastModified: "2024-01-01T00:00:00Z", size: 200 },
    ]);
    expect(result.nextCursor).toBeNull();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob?prefix=default-prefix%2Fsub&limit=100",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
        method: "GET",
      }),
    );
  });

  test("should handle content type in put operations", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = Buffer.from("Hello, world!");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
    });

    const blob = storage.getBlob<Buffer>("test-key");
    const result = await blob.putRaw(data, {
      contentType: "application/octet-stream",
      metadata: { test: "value" },
    });

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: data.toString("base64"),
      contentType: "application/octet-stream",
      metadata: {
        test: "value",
        isBase64: "true",
      },
    });
  });

  test("should handle stream operations with proper content type", async () => {
    const storage = new RemoteBlobStorage("test-project", "test-environment");
    const data = "Hello, world!";
    const stream = Readable.from(data);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) => (name === "etag" ? "mock-etag" : null),
      },
    });

    const blob = storage.getBlob<Readable>("test-key");
    const result = await blob.putStream(stream, {
      contentType: "text/plain",
      metadata: { test: "value" },
    });

    expect(result.etag).toBe("mock-etag");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.gensx.com/org/test-org/projects/test-project/environments/test-environment/blob/test-key",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      content: Buffer.from(data).toString("base64"),
      contentType: "text/plain",
      metadata: {
        test: "value",
        isBase64: "true",
      },
    });
  });
});
