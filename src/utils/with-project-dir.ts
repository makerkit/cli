export async function withProjectDir<T>(
  projectPath: string,
  fn: () => Promise<T>,
): Promise<T> {
  const original = process.cwd();

  try {
    process.chdir(projectPath);
    return await fn();
  } finally {
    process.chdir(original);
  }
}
