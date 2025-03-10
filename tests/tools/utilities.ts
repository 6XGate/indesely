import type { TestContext } from 'vitest';

export function getSuitePath(context: TestContext) {
  let current = context.task.suite;
  let path = context.task.name;
  while (current != null) {
    path = `${current.name}/${path}`;
    current = current.suite;
  }

  return `${context.task.file.name}/${path}`;
}
