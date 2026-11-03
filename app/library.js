export function selectLibrary(info, selection = 'all') {
  if (selection === 'all') return {label: '全部故事与拼音读音', files: info.files, bytes: info.bytes};
  if (selection === 'pinyin') return {label: '拼音读音', ...info.pinyin};
  const [kind, value] = selection.split(':');
  const selected = Object.entries(info.books || {}).filter(([id, book]) => kind === 'book' ? id === value : kind === 'level' && String(book.level) === value);
  if (!selected.length) throw Error('请选择有效的图书或级别。');
  return {label: kind === 'book' ? `《${selected[0][1].title}》` : `${value}级故事`, files: [...new Set(selected.flatMap(([, book]) => book.files))], bytes: selected.reduce((sum, [, book]) => sum + book.bytes, 0)};
}

// Wait for in-flight writes before returning a failure, so temporary caches can
// be deleted safely without a late worker recreating them.
export async function mapLimited(items, action, limit = 4) {
  let next = 0, failed = false;
  const results = await Promise.allSettled(Array.from({length: Math.min(limit, items.length)}, async () => {
    while (!failed && next < items.length) {
      const item = items[next++];
      try { await action(item); } catch (error) { failed = true; throw error; }
    }
  }));
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
}

export async function verifyAsset(response, expectedHash) {
  if (!expectedHash) return;
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== expectedHash) throw Error('部分资源校验失败，请稍后重新获取。');
}
