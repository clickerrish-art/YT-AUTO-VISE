export async function runExclusiveTask(activeTasks, key, operation) {
  if (!(activeTasks instanceof Set)) throw new TypeError("activeTasks must be a Set");
  if (typeof key !== "string" || key.length === 0) throw new TypeError("task key must be a non-empty string");
  if (typeof operation !== "function") throw new TypeError("task operation must be a function");
  if (activeTasks.has(key)) return { acquired: false };
  activeTasks.add(key);
  try {
    return { acquired: true, value: await operation() };
  } finally {
    activeTasks.delete(key);
  }
}
