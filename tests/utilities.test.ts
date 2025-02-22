import { test, expect, vi, describe, beforeEach } from 'vitest';
import { getMessage, requestDatabasePersistence, toError } from '../src/utilities';

test('getMessage', () => {
  expect(getMessage(new Error('test message'))).toBe('test message');
  expect(getMessage(null)).toBe('BadError: null');
  expect(getMessage(undefined)).toBe('BadError: undefined');
  expect(getMessage('test message')).toBe('test message');
  expect(getMessage(Symbol('test message'))).toBe('Symbol(test message)');
  expect(getMessage(/test/iu)).toBe('BadError: [object RegExp]');
  expect(getMessage({ message: { message: 'test message' } })).toBe('test message');
  expect(getMessage({ message: 'test message' })).toBe('test message');
});

test('toError', () => {
  expect(toError(new Error('test message'))).toEqual(new Error('test message'));
  expect(toError('test message')).toEqual(new Error('test message'));
});

describe('requestDatabasePersistence', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: async () => await Promise.resolve(false),
        persist: async () => await Promise.resolve(false),
      },
    });
  });

  test("Shouldn't cause an error", async () => {
    await expect(requestDatabasePersistence()).resolves.toBe(false);
  });

  test("Shouldn't cause an error", async () => {
    await expect(requestDatabasePersistence(true)).rejects.toThrow();
  });
});
