let registration, registering, loadedVersion;
export async function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  if (!registering) registering = (async () => {
    // Capture the version this page loaded before registration can activate an update.
    loadedVersion = (await manifest()).version;
    const workerUrl = new URL('sw.js', document.baseURI);
    if (new URLSearchParams(location.search).has('offline-test')) workerUrl.searchParams.set('mode', 'offline');
    return registration = await navigator.serviceWorker.register(workerUrl, {scope: './', updateViaCache: 'none'});
  })().catch(error => { registering = null; throw error; });
  return registering;
}
async function manifest(fresh = false) {
  const response = await fetch(new URL('precache.json', document.baseURI), fresh ? {cache: 'no-store'} : {});
  if (!response.ok) throw Error('暂时无法获取下载清单，请联网后再试。');
  const info = await response.json();
  if (!/^[a-f0-9]{16}$/.test(info.version) || !Array.isArray(info.files) || !info.files.length) throw Error('资源清单暂时不可用，请稍后重试。');
  return info;
}
function requireOnline() {
  if (navigator.onLine === false) throw Error('当前未联网，请联网后再试。');
}
function waitForWorker(worker, states) {
  return new Promise((resolve, reject) => {
    const finish = error => { clearTimeout(timer); worker.removeEventListener('statechange', changed); error ? reject(error) : resolve(); };
    const changed = () => {
      if (states.includes(worker.state)) finish();
      else if (worker.state === 'redundant') finish(Error('新版暂时没有准备好，请稍后重试。'));
    };
    const timer = setTimeout(() => finish(Error('检查更新超时，请稍后重试。')), 20000);
    worker.addEventListener('statechange', changed); changed();
  });
}
async function checkedRegistration() {
  requireOnline();
  const current = await registerOffline();
  if (!current) throw Error('当前浏览器不支持应用更新，请使用 Safari 打开。');
  await current.update();
  if (current.installing) await waitForWorker(current.installing, ['installed', 'activated']);
  return current;
}
export async function checkForUpdate() {
  const current = await checkedRegistration();
  const info = await manifest(true);
  return {available: Boolean(current.waiting) || info.version !== loadedVersion, version: info.version};
}
export async function prepareReload() {
  // Only this explicit action activates a waiting production update.
  const current = navigator.onLine === false ? await registerOffline() : await checkedRegistration();
  if (current?.waiting) {
    const worker = current.waiting, activated = waitForWorker(worker, ['activated']);
    worker.postMessage({type: 'APPLY_UPDATE'});
    await activated;
  }
}

export async function offlineSize() { return ((await manifest()).bytes / 1024 / 1024).toFixed(1); }
export async function downloadLibrary(progress) {
  if (!('caches' in window) || !('serviceWorker' in navigator)) throw Error('当前浏览器不支持离线下载，请使用 Safari 打开。');
  await (registration || registerOffline());
  await navigator.serviceWorker.ready;
  const info = await manifest();
  const scope = new URL('.', document.baseURI).pathname;
  const cache = await caches.open(`reading-garden:${scope}:${info.version}`);
  let done = 0;
  progress(done, info.files.length);
  for (const file of info.files) {
    const url = new URL(file, document.baseURI);
    if (!await cache.match(url)) {
      const response = await fetch(url, {cache: 'reload'});
      if (!response.ok) throw Error('有些素材还没下载好，请检查网络后重试。');
      try { await cache.put(url, response); }
      catch (error) {
        if (error.name === 'QuotaExceededError') throw Error('设备空间暂时不够，请释放一些空间后再下载。');
        throw Error('浏览器暂时无法保存离线素材，请检查存储设置后重试。');
      }
    }
    progress(++done, info.files.length);
  }
}

export async function refreshLibrary(progress) {
  const current = await checkedRegistration();
  const info = await manifest(true);
  if (current.waiting || info.version !== loadedVersion) throw Error('有新版待启用，请先在“应用更新”中重新加载页面，再获取资源。');
  const base = new URL('.', document.baseURI), prefix = `reading-garden:${base.pathname}:`;
  const temporaryName = `${prefix}refresh-${info.version}-${crypto.randomUUID()}`;
  const temporary = await caches.open(temporaryName);
  try {
    const sourceResponse = await fetch(new URL('assets/sources.json', base), {cache: 'no-store'});
    if (!sourceResponse.ok) throw Error('暂时无法获取来源记录，请联网后重试。');
    const {sources} = await sourceResponse.clone().json();
    const assets = new Map(sources.flatMap(source => source.assets).map(asset => [asset.path, asset]));
    let done = 0;
    progress(done, info.files.length);
    for (const file of info.files) {
      const url = new URL(file, base);
      if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) throw Error('资源清单不正确，请稍后重试。');
      const response = file === 'assets/sources.json' ? sourceResponse.clone() : await fetch(url, {cache: 'no-store'});
      if (!response.ok || response.status !== 200) throw Error('有些资源未能重新获取，请检查网络后重试。');
      const asset = assets.get(file);
      if (asset) {
        const bytes = await response.clone().arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
        if (hash !== asset.sha256) throw Error('部分资源校验失败，请稍后重新获取。');
      }
      await temporary.put(url, response);
      progress(++done, info.files.length);
    }
    if ((await manifest(true)).version !== info.version) throw Error('网站刚刚更新了，请重新获取一次。');
    // Keep the existing offline package until every fresh resource has passed validation.
    const cache = await caches.open(`${prefix}${info.version}`);
    for (const request of await temporary.keys()) await cache.put(request, await temporary.match(request));
  } finally {
    await caches.delete(temporaryName);
  }
}
