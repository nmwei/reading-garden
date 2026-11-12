> 当前开发入口已迁至 [garden-platform/apps/reading](../garden-platform/apps/reading)。此目录保留迁移前历史，下文为原版本说明；日常安装、运行和发布请使用 [工作区说明](../garden-platform/README.md)。

# 阅读小花园 · Reading Garden

花园系列的中文绘本阅读与识字网站，与 ABC小花园（`../abc-garden`）为同级独立项目。

界面设计约定见 [家长弹窗与应用更新](docs/ui-guidelines.md)。

## 当前功能

面向 iPad 的中文绘本阅读和识字。书库收录 80 本绘本、987 页。拼音作为独立活动，绘本正文不标拼音。

- **故事书架**：Storybooks Canada简体中文书库全部40本，共420页正文、460张封面/插图和420段逐页普通话录音。保留原站1～5级，分别15/11/8/4/2本；按级别和主题组合筛选。每本保留文字作者、绘者、译者、朗读者及各自来源记录。
- **StoryWeaver**：本地40本简体中文绘本，共567页，原站分级独立展示，不与Storybooks Canada同号级别混选。保留原始插图、逐本与逐图署名、原文及校订记录；整页与听句使用家长选好的设备中文声音，点字和生字收藏照常可用。无字画页保留；原书个别纯文字页独立排版；图上编号用HTML定位保留，不重绘JPG。
- **最近想读**在首页展示最多 6 本书，`#/library` 提供完整书库、最近读过及分级和主题筛选。两处书卡均可直接加入或移出，保留阅读位置、生字及读完记录。电脑和 iPad 每行 3 本，手机每行 2 本。读完可从第一页重读，并可恢复重读位置。
- **阅读**：大图翻页、整页朗读、响应式正文排版、返回书架及阅读位置恢复。正文不显示拼音。点字求助提示仅在本机首次阅读时显示，后续翻页、换书和刷新不重复。
- **生字篮**支持点字查看语境、听字音和听当前句子。已收藏的字用红色点线标记，可在识字卡中移出或加回。单字读音调用设备中文声音，设备无可用声音时，有原版录音的页面可回退播放整页录音。
- **拼音小课堂**：从导航“学拼音”独立进入；书架底部不再重复放置拼音宣传卡片。包含24个韵母、21个声母、拼写字母y/w、16个整体认读音节和按类型分行的20组四声。63项认识内容与80段四声均可播放；其中ong采用用户试听选定并确认授权的ChinaHelp独立录音，其余使用CLI。三页选择卡统一28px，点字母即播，均有“顺序听”及暂停/继续/停止；认读连播额外等待0.3秒，四声0.2秒。听音练习直接多选声母/韵母/整体认读，保存范围、每题固定三个选项；多类轮换出题，每题选项保持同类并按录音去重。
- **家长小角**：长按1秒确认进入（含直接链接及刷新），离开后需重新确认。中文设备声音选择、按书/级别/拼音/全部范围的离线下载和本机记录清理；应用更新默认收起，只保留检查更新和重新加载并回首页；重新获取资源放在离线区。来源区默认收起，只汇总绘本平台/许可及CLI、ChinaHelp两套拼音来源；逐本署名在家长来源区选择绘本查看，不提供直接打开JSON的家长入口。
- **离线**：HTTPS或localhost下，当前本地完整资源约225 MiB，可按书或来源级别下载；单本书下载统一在家长小角选择。最多4路下载，失败保留已完成项以便续传。基础缓存保留书目和全部封面，已下载的正文图音可断网使用。普通局域网HTTP不支持Service Worker；首次打开需要联网。

## 开发与预览

需要 Node.js 22.x。首次获取依赖：

```sh
npm ci
npm run dev
```

打开终端显示的地址，统一开发默认是 `http://localhost:4173/reading-garden/`；仅静态预览使用 `npm run preview`，地址为 `http://localhost:4178/`。源文件修改后重新执行 `npm run build` 并刷新；开发服务读取 `dist/`，不提供源码热更新。正式站新版安装后等待家长点击“应用更新 → 重新加载并回首页”，再接管并清理旧缓存；安装时会校验并复用旧缓存中仍在本版清单里的图音，不重新下载未变化素材；检查更新不会提前切换版本。本地localhost预览沿用ABC Garden的自动接管方式，初次从旧缓存迁移可能需要刷新两次。本地预览需保持`npm run dev`运行，服务停止时浏览器可能仍显示离线旧页面。浏览器学习记录不清除。

```sh
npm test                     # 状态、内容完整性与音频解码检查，需要ffprobe
npx playwright install chromium webkit
npm run build
npm run test:e2e             # iPad Chromium/WebKit，横竖屏/手机、子路径和离线
```

## 服务器发布

正式地址：[打开花园](https://nmwei.cn/reading-garden/)。GitHub 保留源码，发布脚本不再推送 `main` 或 `gh-pages`，源码推送单独进行。

需要 Node.js 22.x、SSH 和 rsync。服务器已配置独立部署账号，默认连接 `garden-deploy@106.15.155.26`，本机专用密钥位于 `~/.ssh/garden_deploy_nmwei`；私钥不进入仓库。换电脑需安全配置自己的部署权限，并通过可信渠道核对服务器主机指纹，不关闭 SSH 主机校验。

```sh
npm run deploy -- --dry-run             # 构建、冻结快照和校验，不连接服务器
npm run deploy                         # 发布当前项目
npm run deploy -- --rollback           # 切回本项目上一个成功版本
```

默认从 `main` 的干净工作区发布。确需发布已经审阅、尚未提交的改动时，显式加 `--allow-dirty`；版本元数据会记录 `dirty: true`，不会自动暂存、提交或推送。`--host user@host`、`--key /absolute/key` 可覆盖 SSH 配置，也支持 `GARDEN_DEPLOY_HOST`、`GARDEN_DEPLOY_KEY`。

执行链路：重新构建 → 冻结 `dist/` 快照 → 按哈希增量上传到本项目独立版本目录 → 服务器逐文件校验 → 原子切换 `current` → 内部 HTTP 核对。检查失败自动恢复旧入口；上传失败不切换。根目录 `_release.json` 提供源码提交、发布编号及工作区状态。发布后还应核对正式 HTTPS 地址，脚本的内部检查不能替代公网或真实 iPad 验收。

发布产物仅包含静态页面与学习素材，不上传 Git、环境变量、依赖和本机学习数据。旧版本保留供回退；磁盘清理需保留 `current`、`previous` 指向的版本，不自动删除历史发布。三个仓库的发布工具副本保持一致，修改公共发布逻辑时同步三个仓库并运行发布测试。

旧 GitHub Pages 暂时保留迁移期间的访问能力，后续不再更新。旧域名里的学习记录不会自动进入新域名，旧主屏幕图标仍指向旧站；新版本已接入共用账号和云端存档；本期不提供旧站迁移或旧格式兼容。

## 维护入口

扩库前先查[绘本审核台账](docs/book-review-register.md)，以平台和书籍 ID 去重。已有暂缓或不收录结论的书，先补齐复审证据，再更新台账与详细审核记录。

| 文件 | 职责 |
| --- | --- |
| [`docs/book-review-register.md`](docs/book-review-register.md) | 扩库统一入口：逐本收录/未收录理由、审核范围、日期、证据与复审条件；历史详细审核报告另存，不重复搬入全部正文 |
| `data/book-notes.json` | 本项目编写的主题、简介、关键词和亲子提问；独立保存，重新导入不会丢失 |
| `data/books.json` | 书架资料、原站分级`sourceLevel`、每页文字、插图、音频和作者署名 |
| `web/app/reading-levels.js`、`scripts/storybook-metadata.mjs` | 来源分级标签及导入解析；明确记录分级体系，不按年龄或识字量推定级别 |
| `web/app/main.js` | 书架、阅读、生字篮、拼音与家长页面及交互 |
| `web/app/study-layout.css` | 阅读页与拼音活动的响应式工作区；横屏共用选择/示范布局，长文与展开说明保留自然滚动 |
| `web/app/core.js` | 本机记录校验（含独立的`readingList`及6本上限）、路由边界、语境词解释、练习选项 |
| `web/app/pinyin.js` | `FINAL_GROUPS`等定义内容；`TONE_GROUPS`定义分类、生成`TONE_BASES`四声音节，`toneExamples`生成4张卡片；`nextPracticeCategory`/`practicePool`控制多选范围、轮换及同类候选；`PINYIN_RECORDINGS`自动生成；目前不提供家长页面的课程配置 |
| `web/app/audio.js` | 共享播放器、取消、防重叠、可暂停的顺序播放和设备中文声音；`main.js`的`startPinyinSequence`设置额外等待 |
| `web/app/parent-gate.js` | 复用ABC Garden的1秒长按逻辑，释放/移出/失焦/后台取消，支持键盘；`main.js`同时守住路由入口 |
| `web/app/library.js`、`web/app/offline.js`、`sw.js` | 下载范围、4路并发与失败收尾、图音哈希校验、跨版本复用及更新失败清理；保留音频Range响应 |
| `assets/sources.json` | 逐本/逐录音授权、作者、修改说明、来源与SHA256 |
| `scripts/import-assets.mjs` | 读取官方中文目录及逐本HTML，从固定哈希的官方ZIP导入图音；独立核对文字/图片/录音许可；需要curl、unzip |
| `data/storyweaver/*.json`、`scripts/import-storyweaver.mjs` | 经全文和插画审核的原文、校订、逐图版权和固定哈希；`npm run assets:storyweaver`只导入这些已选清单，不自动爬取整个网站 |
| `scripts/import-pinyin.mjs` | 单独导入CLI原始MP3、校验时长并更新来源记录，不重新下载绘本 |
| `scripts/build.mjs` | 核对授权素材哈希、生成静态站与离线版本清单 |
| `scripts/publish.mjs`、`scripts/deploy-site.mjs`、`scripts/publish-site.py` | 静态快照校验、SSH增量上传、独立切换与失败回退；`npm run deploy`调用 |

新增绘本应同时维护书目、逐页素材及来源记录；`sourceLevel`保存原站体系（`system`）和数值（`value`），与授权记录同步。导入读取明确的原站Level元数据，不按CSS类名或页数推测；缺失或不支持的级别会报错，需核对后导入。支持Storybooks Canada 1～5级和StoryWeaver 1～4级；StoryWeaver的4级适合较长篇幅、资料页及亲子讨论，不等同于中文识字量或适龄认证。

正文统一采用30～38px的响应式字号，配合行距及阅读宽度；手机和iPad竖屏上下排版，横屏与电脑左右排版。旧版字号偏好自动忽略，不删除阅读进度、生字篮或其他设置。

构建会拒绝缺失或与来源记录哈希不一致的素材。重新导入绘本使用 `npm run assets:import`；`npm run assets:import -- --refresh`会刷新目录和逐本元数据。缓存保存在忽略目录 `.asset-cache/storybooks/`，图音ZIP锁定版本与SHA256，变化时须先核对再更新。绘本导入保留现有拼音素材及授权，不重新抓取拼音。

## 验证和内容边界

- 内容沿用原站完整中文书库，尚未对孩子逐本做实际阅读难度验证。分级沿用[Storybooks Canada原站标准](https://www.storybookscanada.ca/about/faq/#how-are-reading-levels-assigned-within-storybooks-canada)，主要描述文本长短与句段结构；不代表中文识字量、年龄或孩子已经达到的能力。
- Storybooks Canada文字、插图和原有录音保持原样；StoryWeaver插图保持原始文件，独立文字可做简体化、错字/语病与局部事实校订，原文和修改依据另存。简介、亲子提问、词语解释和界面为本项目编写。译文、解释及发音未经教师逐条审核。
- 拼音主页以符号和「听读音」为主。认识拼音统一采用第一声示范（含 ē、yū 及 r/ri 的 rī），四声对比在独立活动中呈现。声母使用呼读方式示范，如 b 使用 bō。i/u/ü 等单独成音节时使用 yi/wu/yu 等完整拼写。CLI 和 ChinaHelp 原始 MP3 均保持原样。
- 已包含基础符号表及整体认读音节，尚不包含系统拼读课程。按[人教社刊载的教材修订研究](https://www.pep.com.cn/bks/xxyw/jzjd/202512/W020251202580887481487.pdf)，21个声母与拼写字母y/w分开显示；er作为特殊韵母单列，不算复韵母。发音提示由本项目编写，仍需教学反馈。
- “读完”仅由孩子主动点击记录，不代表已经掌握全部生字；翻到最后一页不会自动标记读完。
- 阅读位置、生字篮、读完标记、小书架和拼音练习范围通过统一学习存储保存在 IndexedDB，登录后自动同步。设备音色和首次阅读提示仅留在设备。
- 有正文的页面统一提供「读这一页」，原版录音优先，无录音时用系统朗读。点字后的「听这一句」也使用所选系统声音。原版录音与拼音下载后可离线播放，系统朗读的离线表现取决于设备声音。
- 设备声音列表与实际播放共用 `web/app/audio.js` 的 `chineseVoices()`。排除 Eddy、Flo、Grandma、Grandpa、Reed、Rocko、Sandy、Shelley 及 Apple Eloquence 标识声音，优先选大陆普通话。已保存的声音不可用时，回退到设备提供的可用中文声音。实际可用性和听感需在设备上确认。
- 浏览器模拟检查不能替代真实iPad对触摸、横竖屏、系统声音和主屏幕离线使用的验收。


## 离线与资源修复

- 版本清单 `precache.json` 记录单文件 SHA-256、绘本和拼音下载分组及实际字节量。更新复用通过哈希校验的图音。安装失败时清理新版临时缓存，旧资源和阅读记录仍可用。
- 家长小角「重新获取资源」需要联网。修复先下载到临时缓存，校验图音和版本后再写回。当前书库的完整离线包和修复过程可按 600～800 MB 预留空间，也可选择少量绘本。可用配额取决于浏览器和设备。

## 答题音效

答对使用用户选定的 Mixkit A2（Correct answer reward），答错使用 B2（Wrong answer fail notification）。音频统一到 -16 LUFS、真峰值上限 -2 dBTP，24 kHz 单声道 PCM16；保留原时长、语速和音高。来源及处理哈希见 `assets/audio/feedback-sources.json`，播放逻辑为 `web/app/feedback-audio.js`。题目朗读、切题、离开页面及进入后台会取消旧音效。

两个 WAV 与现有声音素材一起保存在源码仓库的 `assets/audio/` 中，构建时校验 SHA-256，并随站点打包和离线缓存。重新拉取项目即可获得音频；启动、构建和部署无需再下载原音源，也不需要 FFmpeg。来源及许可记录保留在 `assets/audio/feedback-sources.json`。

拼音听音找朋友答对会显示 1.4 秒小花动画。

## 专题资料

- [历次验收](docs/acceptance.md)包含绘本试读、扩库、筛选和离线等历史验证。
- [绘本审核台账](docs/book-review-register.md)汇总书目取舍、扩库来源和复审条件。
- [拼音录音映射复核](docs/pinyin-audio-audit.md)记录逐项来源和复核依据。

## 共用账号与学习存档

与 ABC 使用同一套账号/API。游客可离线学习；登录后自动同步本科最新进度，另可确认保存最多三份手动存档。家长入口显示当前用户名，账号区提供重设密码与退出登录。家长页面统一卡片宽度与暖白底色；宽屏账号和存档并排、应用更新和素材来源并排，声音及复杂下载表单占整行，手机单列。跨科会话共用，学习快照、历史存档、IndexedDB 和编辑锁分别隔离；设备声音不进入云档。

开发前将 `garden-platform`、`abc-garden`、`reading-garden`、`math-garden` 同级检出并运行 `npm install`；本地依赖 `@garden/account` 由 garden-platform 的 `packages/account` 提供，构建时复制进静态产物。正式产物不依赖跨站脚本。修改共享库后重新构建三站。账号联合预览在 garden-platform 运行 `npm run build` 和 `npm run dev`；单站预览主要用于界面与游客功能。

## 仓库职责与开发入口

`web/` 是本站前端源码，`domain/` 是本科数据契约与规则，`server/` 是本科服务端模块。公共 API/账号/数据库/备份与共享浏览器库属于同级 `garden-platform`，一个后端组装三个科目模块。

四仓同级检出后先在各仓执行 `nvm use`（或自行选择 Node.js 22），再执行 `npm install`，平台还需执行 `npm ci --prefix server`。在任何学习仓运行 `npm run dev` 启动本站与统一 API，默认 `http://localhost:4173/`；`npm run dev:gardens` 构建并联调全部学习站。`npm run test:server` 验证平台与三科服务端，平台 `npm run test:browser` 执行手机、平板和桌面跨站验收。

共享库改动后重建受影响前端；科目契约或内容目录改动后也要重新组装服务端。前端产物记录共享库指纹及平台源码提交，服务端发布包记录四仓源码提交、工作区状态及文件哈希。
