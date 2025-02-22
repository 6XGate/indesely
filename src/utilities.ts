import { withResolvers } from './compat.js';
import type { Constructor, IsAny } from 'type-fest';

export function isConstructor(value: unknown): value is Constructor<unknown> {
  return typeof value === 'function' && value.toString().startsWith('class ');
}

export function getMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (cause == null) return `BadError: ${cause}`;
  if (typeof cause === 'string') return cause;
  if (typeof cause !== 'object') return String(cause as never);
  if (!('message' in cause)) return `BadError: ${Object.prototype.toString.call(cause)}`;
  if (typeof cause.message !== 'string') return getMessage(cause.message);
  return cause.message;
}

export type AsError<T> = IsAny<T> extends true ? Error : T extends Error ? T : Error;

export function toError<Cause>(cause: Cause): AsError<Cause>;
export function toError(cause: unknown) {
  if (cause instanceof Error) return cause;
  return new Error(getMessage(cause));
}

/** Is the origin data persistent? Has it been requested or checked? */
let isPersistent: boolean | undefined;

/**
 * Request that the application databases are persisted.
 * @param fail - Indicates whether to throw an error on failure.
 */
export async function requestDatabasePersistence(fail = false) {
  if (isPersistent == null) {
    isPersistent = (await globalThis.navigator.storage.persisted()) || (await globalThis.navigator.storage.persist());
  }

  if (fail && !isPersistent) {
    throw new Error('Unable to persist storage');
  }

  return isPersistent;
}

const defaultErrorTranslator = (cause: DOMException | null): Error | null => cause;

/**
 * Waits on a IndexedDB request to succeed or fail.
 * @param request - The IndexedDB request to wait on.
 * @param onError - Custom error translator or replacer.
 * @returns The result of the IndexedDB request on success.
 * @throws If the IndexedDB request fails.
 */
export async function waitOnRequest<T>(request: IDBRequest<T>, onError = defaultErrorTranslator) {
  const { promise, resolve, reject } = withResolvers<T>();

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(onError(request.error) ?? new Error('Unknown request failure'));

  return await promise;
}
