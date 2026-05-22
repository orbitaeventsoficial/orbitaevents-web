// @vitest-environment node
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve('scripts/check-nonstop-protocol.mjs');

const nonstopClause = [
  'Amb `go` actiu, la resposta final queda prohibida després d\'un tall verd.',
  'El pas immediat és rellegir §6 i continuar automàticament.',
].join(' ');

function writeFixture(files: Record<string, string>) {
  const root = mkdtempSync(path.join(tmpdir(), 'oe-nonstop-'));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    mkdirSync(path.dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, 'utf8');
  }
  return root;
}

function packageJson(validateCore = 'pnpm run qa:protocol && pnpm run qa:nonstop-protocol') {
  return JSON.stringify(
    {
      scripts: {
        'qa:nonstop-protocol': 'node scripts/check-nonstop-protocol.mjs',
        'validate:core': validateCore,
      },
    },
    null,
    2,
  );
}

function runtimePolicy(overrides: Record<string, unknown> = {}) {
  return JSON.stringify(
    {
      schemaVersion: 1,
      repository: 'orbitaevents',
      defaultWorkspacePath: 'D:\\orbitaevents',
      defaultCommand: 'go',
      mode: 'nonstop_until_end',
      finalResponsePolicy: {
        afterGreenCutWithActionableBacklog: 'forbidden',
        allowedWhen: [
          'no_actionable_backlog',
          'real_blocker_requires_human_decision',
          'owner_explicitly_requests_stop_or_report_only',
        ],
      },
      requiredLoopAfterGreenCut: [
        'rereread_section_6',
        'select_next_seguent_or_pendent_critic',
        'continue_automatically_with_short_update',
      ],
      canonicalGuard: 'pnpm run qa:nonstop-protocol',
      ...overrides,
    },
    null,
    2,
  );
}

function runGuard(files: Record<string, string>) {
  const cwd = writeFixture(files);
  return spawnSync(process.execPath, [scriptPath], { cwd, encoding: 'utf8' });
}

describe('check-nonstop-protocol', () => {
  it('passes when protocol, CLAUDE and package scripts keep the nonstop rule', () => {
    const result = runGuard({
      'CLAUDE.md': nonstopClause,
      'docs/protocol-producte-admin-ca.md': nonstopClause,
      'docs/agent-runtime-policy.json': runtimePolicy(),
      'package.json': packageJson(),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('[nonstop-protocol] OK');
  });

  it('fails when CLAUDE.md lacks the final-prohibited clause', () => {
    const result = runGuard({
      'CLAUDE.md': 'Amb `go` actiu, cal rellegir §6 i continuar automàticament.',
      'docs/protocol-producte-admin-ca.md': nonstopClause,
      'docs/agent-runtime-policy.json': runtimePolicy(),
      'package.json': packageJson(),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('CLAUDE.md');
    expect(result.stderr).toContain('resposta final queda prohibida');
  });

  it('fails when the protocol lacks the continue-after-green clause', () => {
    const result = runGuard({
      'CLAUDE.md': nonstopClause,
      'docs/protocol-producte-admin-ca.md': 'Amb `go` actiu, la resposta final queda prohibida.',
      'docs/agent-runtime-policy.json': runtimePolicy(),
      'package.json': packageJson(),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('protocol');
    expect(result.stderr).toContain('continuar automàticament');
  });

  it('fails when validate:core does not run the guard', () => {
    const result = runGuard({
      'CLAUDE.md': nonstopClause,
      'docs/protocol-producte-admin-ca.md': nonstopClause,
      'docs/agent-runtime-policy.json': runtimePolicy(),
      'package.json': packageJson('pnpm run qa:protocol'),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('validate:core');
    expect(result.stderr).toContain('qa:nonstop-protocol');
  });

  it('fails when the runtime policy JSON does not enforce nonstop mode', () => {
    const result = runGuard({
      'CLAUDE.md': nonstopClause,
      'docs/protocol-producte-admin-ca.md': nonstopClause,
      'docs/agent-runtime-policy.json': runtimePolicy({ mode: 'report_only' }),
      'package.json': packageJson('pnpm run qa:protocol'),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('agent-runtime-policy.json');
    expect(result.stderr).toContain('nonstop_until_end');
  });

  it('fails when the runtime policy JSON points outside orbitaevents', () => {
    const result = runGuard({
      'CLAUDE.md': nonstopClause,
      'docs/protocol-producte-admin-ca.md': nonstopClause,
      'docs/agent-runtime-policy.json': runtimePolicy({ repository: 'other-repo' }),
      'package.json': packageJson(),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('repository ha de ser "orbitaevents"');
  });
});
