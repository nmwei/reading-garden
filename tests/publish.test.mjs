import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync, spawnSync} from 'node:child_process';
import {snapshotTree} from '../scripts/publish-tree.mjs';

test('site snapshots reuse unchanged blobs, handle unusual paths and remove withdrawn files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reading-publish-test-'));
  try {
    const repo = join(root, 'objects.git'), site = join(root, 'site');
    await mkdir(site);
    execFileSync('git', ['init', '--bare', '--quiet', repo]);
    const env = {...process.env, GIT_INDEX_FILE: join(root, 'site-index')};
    const git = (args, input) => execFileSync('git', ['--git-dir', repo, ...args], {input, encoding: 'utf8', env}).trim();
    const audio = 'a space "中文"\n.mp3';
    await writeFile(join(site, audio), 'unchanged recording');
    await writeFile(join(site, 'main.js'), 'first version');
    const first = await snapshotTree(site, git);
    assert.equal(git(['show', `${first}:${audio}`]), 'unchanged recording');
    assert.equal(await snapshotTree(site, git), first);
    await writeFile(join(site, 'main.js'), 'next version');
    const next = await snapshotTree(site, git);
    assert.notEqual(next, first);
    assert.equal(git(['rev-parse', `${first}:${audio}`]), git(['rev-parse', `${next}:${audio}`]));
    await rm(join(site, audio));
    const withdrawn = await snapshotTree(site, git);
    assert.equal(git(['ls-tree', '--name-only', withdrawn]), 'main.js');
    await symlink(join(site, 'main.js'), join(site, 'link'));
    await assert.rejects(snapshotTree(site, git), /symlink/);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test('deployment refuses unreviewed changes before building or contacting a remote', async () => {
  const root = await mkdtemp(join(tmpdir(), 'reading-publish-guard-'));
  try {
    execFileSync('git', ['init', '--quiet', '--initial-branch=main', root]);
    await writeFile(join(root, 'review.txt'), 'not committed');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/publish.mjs', import.meta.url)), '--repository', 'nmwei/reading-garden'], {
      cwd: root, encoding: 'utf8', timeout: 5000,
      env: {...process.env, GIT_SSH_COMMAND: 'false', GIT_TERMINAL_PROMPT: '0'}
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Commit or resolve all changes before publishing/);
    assert.equal(await readFile(join(root, 'review.txt'), 'utf8'), 'not committed');
    await assert.rejects(readFile(join(root, '.git/index')), {code: 'ENOENT'});
  } finally { await rm(root, {recursive: true, force: true}); }
});
