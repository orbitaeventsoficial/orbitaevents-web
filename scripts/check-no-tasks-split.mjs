#!/usr/bin/env node
/**
 * qa:no-tasks-split
 * Detects admin route directories outside app/admin/tasks/ whose names
 * suggest a parallel task/queue/kanban workspace — enforces that all
 * operative task management stays in app/admin/tasks/.
 * §6.4 coherència: el model `Task` és canònic i el workspace operatiu
 * únic. Cap variant `todos/`, `task-hub/`, `kanban/`, `work-queue/`,
 * etc. pot aparèixer com a ruta admin paral·lela.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ADMIN_DIR = path.join(repoRoot, 'app', 'admin');
const TASKS_CANONICAL = path.join(ADMIN_DIR, 'tasks');

const TASKS_FRAGMENTS = [
  'todos',
  'todo',
  'task-hub',
  'tasks-hub',
  'task-management',
  'task-pipeline',
  'task-board',
  'task-queue',
  'tasks-queue',
  'work-items',
  'workitems',
  'work-queue',
  'kanban',
  'kanban-board',
  'assignments',
  'assignment-hub',
];

function isTasksSplitName(dirName) {
  const lower = dirName.toLowerCase();
  return TASKS_FRAGMENTS.some(
    (frag) => lower === frag || lower.startsWith(frag + '-') || lower.endsWith('-' + frag),
  );
}

function walkAdminDirs(dir) {
  const violations = [];
  if (!fs.existsSync(dir)) return violations;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (full === TASKS_CANONICAL) continue;
    if (isTasksSplitName(entry.name)) {
      violations.push(path.relative(repoRoot, full));
    }
    violations.push(...walkAdminDirs(full));
  }
  return violations;
}

const violations = walkAdminDirs(ADMIN_DIR);

if (violations.length === 0) {
  process.stdout.write('[no-tasks-split] OK\n');
  process.exit(0);
} else {
  process.stderr.write(
    `[no-tasks-split] FAIL — ${violations.length} tasks-split route(s) found outside app/admin/tasks/:\n`,
  );
  for (const v of violations) process.stderr.write(`  ${v}\n`);
  process.stderr.write('\nOperative task management belongs in app/admin/tasks/.\n');
  process.stderr.write('See §6.4 in docs/admin-protocol.md.\n');
  process.exit(1);
}
