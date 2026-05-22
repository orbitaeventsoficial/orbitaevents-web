// @vitest-environment node
import { mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-no-tasks-split.mjs');

function runGuard(dirs: string[]) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-no-tasks-split-'));
  mkdirSync(path.join(root, 'app', 'admin'), { recursive: true });
  for (const dir of dirs) {
    mkdirSync(path.join(root, 'app', 'admin', dir), { recursive: true });
  }
  return spawnSync(process.execPath, [scriptPath], { cwd: root, encoding: 'utf8' });
}

describe('check-no-tasks-split', () => {
  it('passa quan no hi ha directoris a app/admin', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[no-tasks-split] OK');
  });

  it('passa quan app/admin/tasks/ existeix (directori canònic)', () => {
    const result = runGuard(['tasks', 'tasks/new', 'tasks/[id]']);
    expect(result.status).toBe(0);
  });

  it('falla quan existeix app/admin/todos/', () => {
    const result = runGuard(['todos']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[no-tasks-split] FAIL');
    expect(result.stderr).toContain('todos');
  });

  it('falla quan existeix app/admin/task-hub/', () => {
    const result = runGuard(['task-hub']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('task-hub');
  });

  it('falla quan existeix app/admin/kanban/', () => {
    const result = runGuard(['kanban']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('kanban');
  });

  it('falla quan existeix app/admin/work-queue/', () => {
    const result = runGuard(['work-queue']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('work-queue');
  });

  it('passa amb directoris veïns que no són tasks-split', () => {
    const result = runGuard(['sales-ops', 'leads', 'bookings', 'inbox', 'social']);
    expect(result.status).toBe(0);
  });

  it('falla quan un split apareix en un subdirectori niuat', () => {
    const result = runGuard(['operations/kanban']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('kanban');
  });

  it('reporta múltiples violacions', () => {
    const result = runGuard(['todos', 'task-hub', 'kanban', 'work-queue']);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('todos');
    expect(result.stderr).toContain('task-hub');
    expect(result.stderr).toContain('kanban');
    expect(result.stderr).toContain('work-queue');
  });
});
