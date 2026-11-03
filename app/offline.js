let registration;
export async function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {scope: './'});
  return registration;
}
async function manifest() {
  const response = await fetch(new URL('precache.json', document.baseURI));
  if (!response.ok) throw Error('暂时无法获取下载清单，请联网后再试。');
  return response.json();
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
