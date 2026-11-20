import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths, so the built game works from any folder (e.g. a GitHub Pages sub-path).
  base: './',
  // Other sessions' git worktrees live under .claude/; their copies of the tests aren't ours.
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
