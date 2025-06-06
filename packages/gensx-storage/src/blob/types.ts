import { Readable } from "stream";

/**
 * Error types for blob storage operations
 */
export type BlobErrorCode =
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "CONFLICT"
  | "INVALID_ARGUMENT"
  | "INTERNAL_ERROR"
  | "NOT_IMPLEMENTED"
  | "NETWORK_ERROR";

/**
 * Abstract base error class for blob storage operations
 */
export abstract class BlobError extends Error {
  constructor(
    public readonly code: BlobErrorCode,
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "BlobError";
  }
}

/**
 * Error class for when a blob is not found
 */
export class BlobNotFoundError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("NOT_FOUND", message, cause);
    this.name = "BlobNotFoundError";
  }
}

/**
 * Error class for permission denied errors
 */
export class BlobPermissionDeniedError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("PERMISSION_DENIED", message, cause);
    this.name = "BlobPermissionDeniedError";
  }
}

/**
 * Error class for conflict errors (e.g., ETag mismatch)
 */
export class BlobConflictError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("CONFLICT", message, cause);
    this.name = "BlobConflictError";
  }
}

/**
 * Error class for invalid argument errors
 */
export class BlobInvalidArgumentError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("INVALID_ARGUMENT", message, cause);
    this.name = "BlobInvalidArgumentError";
  }
}

/**
 * Error class for internal errors
 */
export class BlobInternalError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("INTERNAL_ERROR", message, cause);
    this.name = "BlobInternalError";
  }
}

/**
 * Error class for not implemented errors
 */
export class BlobNotImplementedError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("NOT_IMPLEMENTED", message, cause);
    this.name = "BlobNotImplementedError";
  }
}

/**
 * Error class for network errors
 */
export class BlobNetworkError extends BlobError {
  constructor(message: string, cause?: Error) {
    super("NETWORK_ERROR", message, cause);
    this.name = "BlobNetworkError";
  }
}

/**
 * Options for blob operations
 */
export interface BlobOptions {
  /**
   * ETag for conditional operations (optimistic concurrency control)
   */
  etag?: string;

  /**
   * Content type of the blob
   */
  contentType?: string;

  /**
   * Custom metadata associated with the blob
   */
  metadata?: Record<string, string>;
}

/**
 * Result of deleting a blob
 */
export interface DeleteBlobResult {
  deleted: boolean;
}

/**
 * A response from a blob operation that includes metadata
 */
export interface BlobResponse<T> {
  /**
   * The data content of the blob
   */
  content: T;

  /**
   * ETag of the blob
   */
  etag?: string;

  /**
   * Last modified timestamp
   */
  lastModified?: Date;

  /**
   * Size of the blob in bytes
   */
  size?: number;

  /**
   * Content type of the blob
   */
  contentType?: string;

  /**
   * Custom metadata associated with the blob
   */
  metadata?: Record<string, string>;
}

/**
 * Interface for a typed blob object
 */
export interface Blob<T> {
  /**
   * Get the blob as JSON data.
   * @returns The blob data as JSON, or null if not found.
   */
  getJSON(): Promise<T | null>;

  /**
   * Get the blob as a string.
   * @returns The blob data as a string, or null if not found.
   */
  getString(): Promise<string | null>;

  /**
   * Get the raw blob response with metadata.
   * @returns The blob response with metadata, or null if not found.
   */
  getRaw(): Promise<BlobResponse<Buffer> | null>;

  /**
   * Get a readable stream of the blob's content.
   * @returns A readable stream of the blob's content.
   */
  getStream(): Promise<Readable>;

  /**
   * Put JSON data into the blob.
   * @param value The JSON data to store.
   * @param options Optional metadata and etag for conditional updates.
   * @returns The etag of the stored blob.
   */
  putJSON(value: T, options?: BlobOptions): Promise<{ etag: string }>;

  /**
   * Put string data into the blob.
   * @param value The string data to store.
   * @param options Optional metadata and etag for conditional updates.
   * @returns The etag of the stored blob.
   */
  putString(value: string, options?: BlobOptions): Promise<{ etag: string }>;

  /**
   * Put raw data into the blob with metadata.
   * @param value The data to store.
   * @param options Optional metadata and etag for conditional updates.
   * @returns The etag of the stored blob.
   */
  putRaw(value: Buffer, options?: BlobOptions): Promise<{ etag: string }>;

  /**
   * Put a readable stream into the blob.
   * @param stream The readable stream to store.
   * @param options Optional metadata and etag for conditional updates.
   * @returns The etag of the stored blob.
   */
  putStream(stream: Readable, options?: BlobOptions): Promise<{ etag: string }>;

  /**
   * Delete the blob.
   */
  delete(): Promise<void>;

  /**
   * Check if the blob exists.
   * @returns True if the blob exists, false otherwise.
   */
  exists(): Promise<boolean>;

  /**
   * Get metadata associated with the blob
   * @returns The metadata or null if the blob doesn't exist
   */
  getMetadata(): Promise<Record<string, string> | null>;

  /**
   * Update metadata associated with the blob
   * @param metadata The new metadata to store
   * @param options Optional etag for conditional update
   */
  updateMetadata(
    metadata: Record<string, string>,
    options?: BlobOptions,
  ): Promise<void>;
}

/**
 * Options for listing blobs
 */
export interface ListBlobsOptions {
  /**
   * Prefix to filter blobs by
   */
  prefix?: string;

  /**
   * Maximum number of results to return per page
   */
  limit?: number;

  /**
   * Cursor for pagination. This should be the cursor from the previous page's response.
   * If not provided, returns the first page.
   */
  cursor?: string;
}

/**
 * Response from listing blobs with pagination
 */
export interface ListBlobsResponse {
  /**
   * List of blobs
   */
  blobs: { key: string; lastModified: string; size: number }[];

  /**
   * Cursor to get the next page of results.
   * If null, there are no more results.
   */
  nextCursor?: string;
}

/**
 * Interface for blob storage
 */
export interface BlobStorage {
  /**
   * Get a blob object for a specific key
   */
  getBlob<T>(key: string): Blob<T>;

  /**
   * List blobs with cursor-based pagination
   * @param options Options for listing blobs including prefix, pagination, and filtering
   */
  listBlobs(options?: ListBlobsOptions): Promise<ListBlobsResponse>;

  /**
   * Check if a blob exists
   */
  blobExists(key: string): Promise<boolean>;

  /**
   * Delete a blob
   */
  deleteBlob(key: string): Promise<DeleteBlobResult>;
}

/**
 * Provider configuration kinds
 */
export type BlobStorageKind = "filesystem" | "cloud";

/**
 * Base storage configuration
 */
export interface BaseBlobStorageOptions {
  /**
   * Storage kind - if not provided, will be determined from environment
   */
  kind?: BlobStorageKind;

  /**
   * Default prefix for all blob keys
   */
  defaultPrefix?: string;

  /**
   * Optional project name. By default, the GENSX_PROJECT environment variable will be used then the projectName from the gensx.yaml file.
   */
  project?: string;

  /**
   * Optional environment name. By default, the GENSX_ENV environment variable will be used then the currently selected environment in the CLI (e.g. `gensx env select`).
   */
  environment?: string;
}

/**
 * Filesystem storage configuration
 */
export interface FileSystemBlobStorageOptions extends BaseBlobStorageOptions {
  kind?: "filesystem";

  /**
   * Root directory for storing blobs
   */
  rootDir?: string;
}

/**
 * Cloud storage configuration
 */
export interface CloudBlobStorageOptions extends BaseBlobStorageOptions {
  kind?: "cloud";
}

/**
 * Union type for blob storage configuration
 */
export type BlobStorageOptions =
  | FileSystemBlobStorageOptions
  | CloudBlobStorageOptions;
