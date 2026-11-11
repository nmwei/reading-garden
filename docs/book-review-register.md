# 绘本审核台账

最近一次逐本审核日期为 2026-11-04。范围覆盖该次审核时本地已入库的书，以及已有明确审核结论的未入库候选。以平台和书籍 ID 去重。实际书目以 [`data/books.json`](../data/books.json) 为准，线上版本以站点 `_release.json` 为准。

台账共 **107 条**，含已收录 80 本（StoryWeaver 逐本审核 40 本、Storybooks Canada 来源整库 40 本）、暂缓 20 本、不收录当前版本 7 本。《遗失水的案例》两轮审核合并为一条，保留两轮证据。覆盖范围限于台账所列候选。

## 如何使用与更新

1. 扩库先查平台与ID；StoryWeaver记为 `SW:99743`，Storybooks Canada记为 `SBC:0087`。同名异书分别记录，同一ID的新版/新译文先复核版本变化。
2. **暂缓和不收录当前版本都不能直接导入。** 先解决该行的阻碍、补充可核对的复审证据，再更新结论；没有新证据时沿用既有结论，不必重复全书审核。不能只删掉不合适页面、换一个书名、转成简体、依据封面或平台推荐就跳过。
3. 审核理由区分错译/事实、图文、署名资料、当前读者和书库互补价值。当前不适合不等于永久不好；科普疑点尚未核清时写“待核”，不将猜测写成已确认事实。
4. 结论改变时在本台账更新该ID的一条记录，记下日期、旧结论→新结论、触发条件与新证据；旧审核报告保留，不覆盖历史。修订过的版本入库须保留原文、校订和图文各自来源/许可。
5. 本台账记录编辑取舍；实际是否入库以 [`data/books.json`](../data/books.json) 为准，是否已上线另以发布记录为准。新书的审核记录、实际入库和发布是不同状态；台账不是导入脚本的自动拦截器。

| 状态 | 含义与后续处理 |
| --- | --- |
| 已收录·逐本审核 | 已基于完整正文和插画审核入库；仍保留校订、共读和真机试读边界，不代表教师或领域专家认证。 |
| 已收录·来源整库 | 按用户要求导入完整来源书库，已核对内容/图音/署名/许可；不冒充每本均经过与StoryWeaver相同的文学和适读性精审。 |
| 暂缓 | 可能有价值，但有待核资料、重译、事实/图文修订，或当前主题/年龄需求不足；满足本行条件才复审。 |
| 不收录当前版本 | 当前版本与识字/亲子绘本目标、核心科学说明或行为示范冲突，不能靠几处轻校解决；有实质新版本或明确新场景时才能重新评估，不是永久封禁作品。 |

## 扩库来源入口

| 来源 | 内容与审核要求 |
| --- | --- |
| [Storybooks Canada 简体中文](https://www.storybookscanada.ca/stories/zh/) | 已导入完整中文书库。复用时按篇核对图、文、录音许可、署名及非商业限制。参见[原站源文件说明](https://www.storybookscanada.ca/about/source/)。 |
| [StoryWeaver](https://storyweaver.org.in/) | 有简体中文绘本。分别记录文字、插图和朗读视频的许可。参见[开放内容说明](https://storyweaver.org.in/en/open-content)。 |
| [Book Dash](https://bookdash.org/books/) | 可作为译配中文版本的候选。按具体作品核对复用条件、署名及译文。参见[开放内容合作说明](https://bookdash.org/who-we-are/open-content-partners/)。 |

短句试读可从《我喜欢看书》《很饿的鳄鱼》《我的小猫猫在哪儿？》开始，详见下方 Storybooks Canada 书目。

## 未收录：先查这里

以下理由来自已有报告；将原报告的“未导入/暂缓”按阻碍性质细分为“暂缓”和“不收录当前版本”，两者均不得直接导入。这里补充可执行的复审条件，不声称进行了新一轮全文审核。未记明页码的旧报告按原记录保留，不能补造页码；复审时需补具体页码/原句/插画证据。

### 不收录当前版本（7本）

平台均为StoryWeaver。表中级别为原站级别，日期为已有审核日期。

| ID与原书 | 级别 | 审核日期 | 阻碍与具体依据 | 何时才复审 | 详细记录 |
| --- | --- | --- | --- | --- | --- |
| `SW:20576` [神奇的菲波那切数列](https://storyweaver.org.in/en/stories/20576-shen-qi-de-fei-bo-na-qie-shu-lie) | 4级 | 2026-11-04 | **科普核心与图示绑定**：后半把海螺、蜗牛、鸡蛋、飓风等形似螺旋直接联系成斐波那契规律；花瓣示例还需区分苞片和花瓣。 | 需重核核心科学论证与每幅关联图，不接受只统一“斐波那契”译名后直接导入。 | [四级] |
| `SW:266418` [阿咘的大地震](https://storyweaver.org.in/en/stories/266418-apu-s-giant-earthquake) | 3级 | 2026-11-03 | **安全动作与插图联动**：原书故事及附页包含躲床下、近出口就外跑等避震动作，不能仅改一句提示解决。 | 只有核对权威避震资料、逐页审查动作和图文，并明确解决原图仍示范旧动作的问题后才复审。 | [首轮] |
| `SW:412162` [大山中的小鸟](https://storyweaver.org.in/en/stories/412162-dashan-zhong-de-xiao-niao) | 3级 | 2026-11-03 | **救助动作与插图联动**：给伤鸟敷泥、喂食等动作贯穿故事；现有版本不宜直接作低龄救助示范。 | 出现经过可靠野生动物救助依据复核、且图文均已修正的版本，再全文重审。 | [首轮] |
| `SW:412364` [狐狸和公鸡](https://storyweaver.org.in/en/stories/412364-huli-he-gongji) | 3级 | 2026-11-03 | **当前读者与情绪体验**：情节说理较单线，结尾狐狸吃公鸡与家人；相对现有候选，趣味和情绪层次的新增价值较弱。 | 若转向更高龄寓言专题，家长先审结局与画面，再重新说明它相对现有书库的价值。 | [首轮] |
| `SW:577900` [一团棉花糖](https://storyweaver.org.in/en/stories/577900-yi-tuan-mianhua-tang) | 1级 | 2026-11-03 | **当前识字目标**：整本原作无字，不是漏抓中文；不能擅自编写正文把它算成简体中文认字书。 | 仅在用户明确需要无字图画书时，按观察、口述和插画质量另行评估，明确标记无字，不能补造原文。 | [首轮] |
| `SW:639438` [友谊万岁！儿童幽默剧](https://storyweaver.org.in/en/stories/639438-long-live-friendship-a-humorous-play-for-children) | 4级 | 2026-11-04 | **文体、题材与事实**：多页纯文字剧本，死神和反复殴打的幽默不适合当前亲子绘本场景；“疟疾不再致命”的绝对说法也未通过审核。 | 若用户明确新增高龄戏剧专题，重新核事实、冲突表达、演出与图文适配；不得沿用原句作医学结论。 | [四级] |
| `SW:707584` [网络好朋友的秘密](https://storyweaver.org.in/en/stories/707584-wangluo-hao-pengyou-de-mimi) | 4级 | 2026-11-04 | **网络安全示范与场景**：面向13岁社交网络使用者；译文整段重复，成年人陪孩子到现场“试探”陌生人的情节需重新审查，附录是印度地区热线。 | 仅在明确高龄网络安全需求后，全文去重、重新核对安全示范和地域信息；不能只改热线或删重就入库。 | [四级] |

### 暂缓（20本）

| ID与原书 | 级别 | 最近审核日期 | 阻碍与具体依据 | 复审条件 | 详细记录 |
| --- | --- | --- | --- | --- | --- |
| `SW:18535` [姐姐，姐姐，雷声从哪来](https://storyweaver.org.in/en/stories/18535-jiejie-jiejie-leisheng-cong-na-lai) | 3级 | 2026-11-03 | **科学与叙事表达待核**：对雨中活动、感冒和体罚笑话的相关表述需要事实及语境复核，不宜沿用当前译文直接教读。 | 完成科学说明核查、语言校订和家长对相关笑话的适读性判断。 | [首轮] |
| `SW:19535` [尼玛今天吃什么](https://storyweaver.org.in/en/stories/19535-ni-ma-jin-tian-chi-shen-me) | 2级 | 2026-11-03 | **图文、署名与译文**：图中草莓却标“荔枝”，相关图的署名也有矛盾，附录多项漏译。 | 对照原作及逐图署名确认物种，补齐附录；无法确认的内容不能靠猜测填补。 | [首轮] |
| `SW:20050` [姐姐，姐姐，太阳晚上去了哪里？](https://storyweaver.org.in/en/stories/20050-jie-jie-jie-jie-tai-yang-wan-shang-qu-le-na-li) | 3级 | 2026-11-03 | **当前读者适配**：文字有诗意、昼夜解释有价值，但恶魔尖牙大眼的近景对当前5岁读者可能过于惊吓。 | 孩子年龄或接受度变化后，家长先看相关原图，再决定；不是作品永久淘汰。 | [首轮] |
| `SW:20439` [印度冬天里的热茶和温暖的地毯](https://storyweaver.org.in/en/stories/20439-hot-tea-and-warm-rugs-in-india-during-the-winter-season) | 2级 | 2026-11-03 | **需要重译**：“muffler”译成“消声器”，并有乱码和大量英文残留，核心意思需重译。 | 逐页对照原作完成新译文并留痕，再复核服饰、气候和图文关系。 | [首轮] |
| `SW:20806` [孔雀与大树](https://storyweaver.org.in/en/stories/20806-peacocks-and-pakodas) | 2级 | 2026-11-03 | **需要重译**：文化内容有价值，但“湿地球”等错译和未译词贯穿，当前文字不适合直接认读。 | 完成整书语言校订，补核文化词并逐页与原图对应。 | [首轮] |
| `SW:20957` [一个红风筝](https://storyweaver.org.in/en/stories/20957-yi-ge-hong-feng-zheng) | 1级 | 2026-11-03 | **关键句待核**：马车、追逐等关键句不通顺；押韵叙事不能靠猜原意修补。 | 对照原作确认动作和因果，再重校中文节奏与图文。 | [首轮] |
| `SW:92446` [穆塔吉几岁了？](https://storyweaver.org.in/en/stories/92446-mu-ta-ji-ji-suile) | 4级 | 2026-11-04 | **历史与语言需系统重校**：家庭推理与插画好，但有“生日是及时”“旧温室”“因该”等错误；2016年计算、历史婚龄及印度门纪年等需重校。 | 完整核查历史事件、年份运算和文化词，明确故事发生在2016年，再对照原作重审；不能把年份改成今年。 | [四级] |
| `SW:99708` [法蒂和青蛇](https://storyweaver.org.in/en/stories/99708-fa-di-he-qing-she) | 2级 | 2026-11-03 | **新增价值较弱**：主要是遇蛇惊吓、父亲用棍子追蛇和反复告诫，情节相对单薄。 | 有明确相关主题需求时重审故事与动作示范，证明相对现有书的新增价值。 | [首轮] |
| `SW:99736` [向上世界，向下世界](https://storyweaver.org.in/en/stories/99736-xiangshang-shijie-xiang-xia-shijie) | 3级 | 2026-11-03 | **需要整书重译**：同名多译、未译英文、错词和语病密集，不是几处轻校可以解决。 | 完成整书重译及自然知识复核，保留原文和修改理由后再评估。 | [首轮] |
| `SW:99743` [遗失水的案例](https://storyweaver.org.in/en/stories/99743-yishi-shui-de-anli) | 4级 | 2026-11-03、11-04 | **系统性术语误译**：把蓄水池/水塘叫“水缸”、拦水堤译成“外滩”，还有“水缸地低下”“倒塌在小船”等语病；两轮均暂缓。 | 完成整书水利术语与中文校订；再审取水争议的收束及人物行为，不因Verified或4级标签直接放行。 | [首轮]、[四级] |
| `SW:99794` [伸出你的舌头！](https://storyweaver.org.in/en/stories/99794-shen-chu-ni-de-shetou) | 2级 | 2026-11-03 | **科普待重审**：“舌头永不疲倦疼痛”、北极熊蓝舌吸热等表述有疑点，未获得可靠复核。 | 对照原作和可靠动物/生理资料逐条核实；有疑点不能只按简繁转换后导入。 | [首轮] |
| `SW:99798` [那是什么味道？](https://storyweaver.org.in/en/stories/99798-na-shi-shenme-weidao) | 3级 | 2026-11-03 | **科普与误译待解**：悬念好，但酥油归为腌制食物、包装食品变质最慢等表述尚未可靠解决。 | 核对食物分类、保存与嗅觉知识，并完整重审相关图文。 | [首轮] |
| `SW:266371` [一起去收集种子吧！](https://storyweaver.org.in/en/stories/266371-let-s-go-seed-collecting) | 3级 | 2026-11-03 | **附录事实待重校**：故事有价值，但香蕉种子泛化和多个拉丁学名错误尚待核实。 | 逐项核对植物、种子和学名，修订附录及对应图文；不删掉难核附录来宣称完整导入。 | [首轮] |
| `SW:266437` [懒惰的舅舅](https://storyweaver.org.in/en/stories/266437-lazy-mama) | 3级 | 2026-11-03 | **技术与使用场景待核**：VR情节有反转，但儿童使用语境、眼动传感器和术语起源等说明仍待核实。 | 用可靠原始资料核清技术和使用边界，再审核中文及适读性。 | [首轮] |
| `SW:323710` [水之声](https://storyweaver.org.in/en/stories/323710-the-sound-of-water) | 4级 | 2026-11-04 | **需要重译与情节复核**：未译拟声、“去看船”“白头风筝”“打井”等误译，主人公译名多变；还涉及儿童独自接近井和豹。 | 全文重译、核对动物及动作，并审查图文里的接近野生动物情节。 | [四级] |
| `SW:412423` [穿越时空的河](https://storyweaver.org.in/en/stories/412423-chuanyue-shikong-de-he) | 3级 | 2026-11-03 | **需要系统重审**：历史、污染和河流术语的机翻密集，影响核心因果理解。 | 完整对照原作，重校历史与环境知识和人物因果，不能只挑容易的页导入。 | [首轮] |
| `SW:450294` [迷失在互联网中](https://storyweaver.org.in/en/stories/450294-lost-in-the-internet) | 4级 | 2026-11-04 | **技术与中文需双重审核**：数字世界插画好，但TCP被译作交通控制处，DNS、IP、电路交换等解释和中文语句存在问题。 | 技术概念与比喻边界逐条核实，重校中文，不把局部术语替换当成整书审核通过。 | [四级] |
| `SW:577649` [爸爸的爱好](https://storyweaver.org.in/en/stories/577649-baba-de-aihao) | 1级 | 2026-11-03 | **资料待补齐**：生活笑点不错，但既有导出记录中的署名/翻译角色不够一致；这不是已认定版权侵权。 | 先确认原作是否中文原创、真实角色及图文各自许可，保存证据；不能为了满足导入字段而虚构译者。 | [首轮] |
| `SW:577907` [睡觉吧](https://storyweaver.org.in/en/stories/577907-shuijiao-ba) | 1级 | 2026-11-03 | **书库互补价值较弱**：插画可看、适合睡前，但仅12个不同汉字，当前识字扩库的新增价值较低。 | 新增睡前共读需求或替补书时再评估，不以字少等同于书差。 | [首轮] |
| `SW:659337` [我的银河系有个黑洞](https://storyweaver.org.in/en/stories/659337-there-s-a-hole-in-my-galaxy) | 4级 | 2026-11-04 | **天文学与译文需重审**：插画出色，但人名和数字单位混乱，“银河系中央有一个巨大的星系”“3000亿公里之外”等与指向不符。 | 核对恒星演化、黑洞质量/距离/数量、诺奖归属及幻想边界，并逐页修译；好图不能覆盖未解决事实。 | [四级] |

## 已收录：StoryWeaver逐本审核（40本）

共40本，原站1/2/3/4级为13/10/13/4本。收录理由简写于此；详细认字、故事、插画维度见[首轮]和[四级]，原文、校订、署名与事实依据见每本审核清单。全部没有配套故事录音，不能把设备单字声音写成原版朗读。

| ID与原书 | 级别 | 审核日期 | 简要收录理由与边界 | 详细记录 |
| --- | --- | --- | --- | --- |
| `SW:18612` [忙碌的蚂蚁](https://storyweaver.org.in/en/stories/18612-mang-lu-de-ma-yi) | 1级 | 2026-11-03 | 大小、快慢、队伍；短句可预测；跟蚂蚁找食物、传信、钻缝，观察有趣。 | [清单](../data/storyweaver/18612.json) / [首轮] |
| `SW:18671` [我不害怕！](https://storyweaver.org.in/en/stories/18671-wo-bu-hai-pa) | 1级 | 2026-11-03 | “是谁/是什么/不害怕”反复；把未知影声认成熟悉人和事。 | [清单](../data/storyweaver/18671.json) / [首轮] |
| `SW:19019` [伦蒂：做梦的女孩](https://storyweaver.org.in/en/stories/19019-lun-di-zuo-meng-de-nv-hai) | 1级 | 2026-11-03 | 云朵、脚丫、排队；具体动作；任务与白日梦交织，结尾接纳想象。 | [清单](../data/storyweaver/19019.json) / [首轮] |
| `SW:19271` [我的鱼！不，我的鱼！](https://storyweaver.org.in/en/stories/19271-wo-de-yu-bu-wo-de-yu) | 1级 | 2026-11-03 | 鱼、池塘、我的；短对话；争抢同条鱼，鱼儿反击形成幽默反转。 | [清单](../data/storyweaver/19271.json) / [首轮] |
| `SW:19272` [现在不行，现在不行！](https://storyweaver.org.in/en/stories/19272-xian-zai-bu-xing) | 1级 | 2026-11-03 | “现在不行/我问……”反复；失望到生日惊喜，有悬念和情绪变化。 | [清单](../data/storyweaver/19272.json) / [首轮] |
| `SW:20570` [寻找另一个自己](https://storyweaver.org.in/en/stories/20570-xun-zhao-ling-yi-ge-zi-ji) | 1级 | 2026-11-03 | “和我一样”；身体与能/不能；寻找相同者后发现自己的独特性。 | [清单](../data/storyweaver/20570.json) / [首轮] |
| `SW:20873` [我第一天上学](https://storyweaver.org.in/en/stories/20873-rani-first-day-at-school) | 1级 | 2026-11-03 | 妈妈、手、学校；日常动作；从不舍到安心入校，分离情绪细腻。 | [清单](../data/storyweaver/20873.json) / [首轮] |
| `SW:21482` [太大了，太小了](https://storyweaver.org.in/en/stories/21482-tai-da-le-tai-xiao-le) | 1级 | 2026-11-03 | 太大/太小、能/不能反复；能力困惑到“不大不小刚刚好”。 | [清单](../data/storyweaver/21482.json) / [首轮] |
| `SW:99706` [基乌的魔力](https://storyweaver.org.in/en/stories/99706-ji-wu-de-moli) | 1级 | 2026-11-03 | 眼睛、形状、颜色；短句；看不清像魔法，戴眼镜后仍有想象。 | [清单](../data/storyweaver/99706.json) / [首轮] |
| `SW:99713` [小心！ 老虎来了！](https://storyweaver.org.in/en/stories/99713-xiaoxin-laohu-laile) | 1级 | 2026-11-03 | 老虎、森林；警报拟声词；从老虎视角发现森林警报，有反转。 | [清单](../data/storyweaver/99713.json) / [首轮] |
| `SW:99717` [我们来玩吧](https://storyweaver.org.in/en/stories/99717-women-lai-wan-ba) | 1级 | 2026-11-03 | 跑、游泳、骑车；规律短句；动作观察型读物，补充运动主题。 | [清单](../data/storyweaver/99717.json) / [首轮] |
| `SW:577904` [种星星](https://storyweaver.org.in/en/stories/577904-zhong-xingxing) | 1级 | 2026-11-03 | 种、浇水、叶子、花蕾；种星星到星形花朵的短悬念。 | [清单](../data/storyweaver/577904.json) / [首轮] |
| `SW:577905` [塔拉和魔法放大镜](https://storyweaver.org.in/en/stories/577905-ta-la-he-mofa-fangdajing) | 1级 | 2026-11-03 | 草、虫、巨大；短诗和比较；放大镜带来新视角，短而有发现。 | [清单](../data/storyweaver/577905.json) / [首轮] |
| `SW:18453` [猴子遇干旱](https://storyweaver.org.in/en/stories/18453-hou-zi-yu-gan-han) | 2级 | 2026-11-03 | 搬家、分享、家人；动作反复；干旱迁居、冲突到接纳，因果完整。 | [清单](../data/storyweaver/18453.json) / [首轮] |
| `SW:19855` [妮塔为什么倒挂着？](https://storyweaver.org.in/en/stories/19855-ni-ta-wei-shen-me-dao-gua-zhe) | 2级 | 2026-11-03 | 外貌、性格；短页逐个认识朋友；从担心不一样到被接纳，温柔完整。 | [清单](../data/storyweaver/19855.json) / [首轮] |
| `SW:20012` [去买书](https://storyweaver.org.in/en/stories/20012-qu-mai-shu) | 2级 | 2026-11-03 | 大/小、厚/薄、现在/待会；孩子自主挑书，回家和爷爷共读。 | [清单](../data/storyweaver/20012.json) / [首轮] |
| `SW:20032` [刷牙不好玩](https://storyweaver.org.in/en/stories/20032-shua-ya-bu-hao-wan) | 2级 | 2026-11-03 | “先做一件事”；清洁收拾词；用游戏和哼歌化解无聊，贴近生活。 | [清单](../data/storyweaver/20032.json) / [首轮] |
| `SW:65113` [小猪的尾巴逃跑了](https://storyweaver.org.in/en/stories/65113-xiaozhu-de-weiba-taopao-le) | 2级 | 2026-11-03 | 重复问答、叠词拟声；多种地形；找尾巴变成试尾巴，结尾接纳改变。 | [清单](../data/storyweaver/65113.json) / [首轮] |
| `SW:92448` [绘画游戏](https://storyweaver.org.in/en/stories/92448-huihua-youxi) | 2级 | 2026-11-03 | 形状、线条和画画活动有可操作的认字支点，连续插画适合作为首个无故事录音的亲子试读样本。 | [清单](../data/storyweaver/92448.json) / [试读] |
| `SW:99710` [法蒂和汤锅](https://storyweaver.org.in/en/stories/99710-fa-di-he-tangguo) | 2级 | 2026-11-03 | 一二三、搅汤；重复观察句；偷吃与碗里无肉构成自然后果。 | [清单](../data/storyweaver/99710.json) / [首轮] |
| `SW:99711` [贾尼丝的唐人街之行](https://storyweaver.org.in/en/stories/99711-jia-ni-si-de-tangrenjie-zhi-xing) | 2级 | 2026-11-03 | “下一站/买什么”；购物物品；三站购物到带走“记忆”，亲情转折。 | [清单](../data/storyweaver/99711.json) / [首轮] |
| `SW:99720` [一起制作青柠汁吧！](https://storyweaver.org.in/en/stories/99720-yiqi-zhizuo-qing-ning-zhi-ba) | 2级 | 2026-11-03 | 平均、等份、一半；实物分数；分享饮料、合作调制，有完整任务。 | [清单](../data/storyweaver/99720.json) / [首轮] |
| `SW:577893` [聪明的欧文](https://storyweaver.org.in/en/stories/577893-congming-de-owen) | 2级 | 2026-11-03 | 仅19个不同汉字；观察讲述为主；书与想象赶走“无知怪”，精选例外。 | [清单](../data/storyweaver/577893.json) / [首轮] |
| `SW:99715` [举重公主](https://storyweaver.org.in/en/stories/99715-juzhong-gongzhu) | 3级 | 2026-11-03 | 训练、比赛、冠军；动作链；公主为自己成为冠军，结尾有力量。 | [清单](../data/storyweaver/99715.json) / [首轮] |
| `SW:266338` [一名舞蹈家的故事](https://storyweaver.org.in/en/stories/266338-the-story-of-a-dancer) | 3级 | 2026-11-03 | 跳、转、练习；传记动作词；学舞、远行、回乡再帮助更多孩子。 | [清单](../data/storyweaver/266338.json) / [首轮] |
| `SW:266344` [南亚鸨，一路顺风](https://storyweaver.org.in/en/stories/266344-fly-safe-godavan) | 3级 | 2026-11-03 | 鸟蛋、孵化、草原、保护；护蛋误会到幼鸟成长，生态情节有转折。 | [清单](../data/storyweaver/266344.json) / [首轮] |
| `SW:266363` [你的酒窝呢？](https://storyweaver.org.in/en/stories/266363-where-did-your-dimples-go) | 3级 | 2026-11-03 | 卷发、酒窝、特征、遗传；由家人相像谈到独一无二，有幽默。 | [清单](../data/storyweaver/266363.json) / [首轮] |
| `SW:266369` [了解恐龙](https://storyweaver.org.in/en/stories/266369-discovering-dinosaurs) | 3级 | 2026-11-03 | 大小、高矮、比较；物种名较难；百科比较型，不冒充情节故事。 | [清单](../data/storyweaver/266369.json) / [首轮] |
| `SW:266388` [地球呼叫阿鲁](https://storyweaver.org.in/en/stories/266388-earth-calling-aru) | 3级 | 2026-11-03 | 飞、落、地球、质量；拟人对话；“关闭引力”的假想实验有因果和幽默。 | [清单](../data/storyweaver/266388.json) / [首轮] |
| `SW:266409` [去看蜘蛛咯！](https://storyweaver.org.in/en/stories/266409-off-to-see-spiders) | 3级 | 2026-11-03 | “出发去看蜘蛛”；形态和方位；沿路发现不同蜘蛛，从害怕到好奇。 | [清单](../data/storyweaver/266409.json) / [首轮] |
| `SW:266453` [在外太空的古尔](https://storyweaver.org.in/en/stories/266453-gul-in-space) | 3级 | 2026-11-03 | 吃饭、洗头、睡觉；太空词；生日太空旅程，用日常作息串联。 | [清单](../data/storyweaver/266453.json) / [首轮] |
| `SW:266456` [魔幻眼镜](https://storyweaver.org.in/en/stories/266456-the-magical-glasses) | 3级 | 2026-11-03 | “是什么/让我看”；动物词；对话与猜谜把物种知识串成故事。 | [清单](../data/storyweaver/266456.json) / [首轮] |
| `SW:266466` [星光之旅](https://storyweaver.org.in/en/stories/266466-the-starlight-adventure) | 3级 | 2026-11-03 | 方向、情绪、飞船；拟声词；找月亮、助人、遇险再回家的冒险。 | [清单](../data/storyweaver/266466.json) / [首轮] |
| `SW:267081` [奶奶去公园的路](https://storyweaver.org.in/en/stories/267081-nani-s-walk-to-the-park) | 3级 | 2026-11-03 | 巷名反复；生活、方位、亲情；赶路到理解奶奶，社区故事温暖。 | [清单](../data/storyweaver/267081.json) / [首轮] |
| `SW:412394` [我喜欢这样的雨](https://storyweaver.org.in/en/stories/412394-wo-ruhe-xihuan-wo-de-yu) | 3级 | 2026-11-03 | 雨、水、草木；短诗有节奏；感官自然诗，补充文体而非冒险。 | [清单](../data/storyweaver/412394.json) / [首轮] |
| `SW:412676` [安娜的非凡天气实验](https://storyweaver.org.in/en/stories/412676-anna-de-qimiao-tianqi-shiyan) | 3级 | 2026-11-03 | “书籍”反复；仪器与气象词；从生日要书到科学研究，愿望呼应。 | [清单](../data/storyweaver/412676.json) / [首轮] |
| `SW:268121` [拾金不昧](https://storyweaver.org.in/en/stories/268121-pick-it-up) | 4级 | 2026-11-04 | 钱包、归还等生活词串联诱惑、犹豫和选择，连续漫画表情清楚；金额及行为评价已对照原作校订。 | [清单](../data/storyweaver/268121.json) / [四级] |
| `SW:467095` [Mangalyaan：火星之旅](https://storyweaver.org.in/en/stories/467095-mangalyaan-a-journey-to-mars) | 4级 | 2026-11-04 | 航天任务按距离、燃料、轨道和导航推进，图解清楚；关键事实已校订，长资料段适合分次陪读。 | [清单](../data/storyweaver/467095.json) / [四级] |
| `SW:639353` [谁偷走了巴伊亚的笑容](https://storyweaver.org.in/en/stories/639353-who-stole-bhaiya-s-smile) | 4级 | 2026-11-04 | 重复生活词和时间表达连接理解与陪伴，黑烟怪物的大小有叙事作用；涉及抑郁主题与怪物，需家长先看。 | [清单](../data/storyweaver/639353.json) / [四级] |
| `SW:639414` [阿利雅的飞行梦](https://storyweaver.org.in/en/stories/639414-arya-s-fly-dream) | 4级 | 2026-11-04 | “想飞”贯穿成长线，水彩细腻、结尾呼应家人；含人物死亡/失踪资料，需家长先读。 | [清单](../data/storyweaver/639414.json) / [四级] |

## 已收录：Storybooks Canada来源整库（40本）

共同收录依据：用户明确要求导入该来源全部简体中文书；每本有可独立展示的中文正文、原插画和逐页普通话录音，覆盖原站1～5级。2026-11-03已逐本核对官方内容、图音对应、署名和独立许可，过程见[整库导入记录](acceptance.md#完整40本中文书库与分组离线2026-11-03)。

这40本**未补造逐本文学/适读性精选结论**。共同录音、图文条件和来源核验是当时的收录理由，后续发现题材、译文或事实问题仍应按同样规则复审。单本许可不同，不能按同平台推定；详见 [`assets/sources.json`](../assets/sources.json)。以下日期指整库导入核验日期，不代表新增了一次人工质量精审。

| ID与原书 | 原站级别 |
| --- | --- |
| `SBC:0002` [看看农场里的动物](https://www.storybookscanada.ca/stories/zh/0002/) | 1级 |
| `SBC:0003` [校服](https://www.storybookscanada.ca/stories/zh/0003/) | 1级 |
| `SBC:0008` [你在做什么？](https://www.storybookscanada.ca/stories/zh/0008/) | 1级 |
| `SBC:0009` [我的小猫猫在哪儿？](https://www.storybookscanada.ca/stories/zh/0009/) | 1级 |
| `SBC:0030` [感情](https://www.storybookscanada.ca/stories/zh/0030/) | 1级 |
| `SBC:0067` [做菜](https://www.storybookscanada.ca/stories/zh/0067/) | 1级 |
| `SBC:0087` [我喜欢看书](https://www.storybookscanada.ca/stories/zh/0087/) | 1级 |
| `SBC:0112` [我的身体](https://www.storybookscanada.ca/stories/zh/0112/) | 1级 |
| `SBC:0120` [头发](https://www.storybookscanada.ca/stories/zh/0120/) | 1级 |
| `SBC:0129` [贪玩的弟弟](https://www.storybookscanada.ca/stories/zh/0129/) | 1级 |
| `SBC:0156` [很饿的鳄鱼](https://www.storybookscanada.ca/stories/zh/0156/) | 1级 |
| `SBC:0231` [气象书](https://www.storybookscanada.ca/stories/zh/0231/) | 1级 |
| `SBC:0271` [两个](https://www.storybookscanada.ca/stories/zh/0271/) | 1级 |
| `SBC:0302` [火](https://www.storybookscanada.ca/stories/zh/0302/) | 1级 |
| `SBC:0327` [数数动物](https://www.storybookscanada.ca/stories/zh/0327/) | 1级 |
| `SBC:0001` [一个很高的人](https://www.storybookscanada.ca/stories/zh/0001/) | 2级 |
| `SBC:0004` [山羊、野狗、和水牛](https://www.storybookscanada.ca/stories/zh/0004/) | 2级 |
| `SBC:0027` [决定](https://www.storybookscanada.ca/stories/zh/0027/) | 2级 |
| `SBC:0089` [和植物聊天的卡莱](https://www.storybookscanada.ca/stories/zh/0089/) | 2级 |
| `SBC:0095` [赞玛很棒！](https://www.storybookscanada.ca/stories/zh/0095/) | 2级 |
| `SBC:0111` [为什么河马没有毛发](https://www.storybookscanada.ca/stories/zh/0111/) | 2级 |
| `SBC:0210` [丁吉和奶牛](https://www.storybookscanada.ca/stories/zh/0210/) | 2级 |
| `SBC:0234` [球星安迪斯瓦](https://www.storybookscanada.ca/stories/zh/0234/) | 2级 |
| `SBC:0296` [卖香蕉的汤姆](https://www.storybookscanada.ca/stories/zh/0296/) | 2级 |
| `SBC:0337` [蜡做的孩子](https://www.storybookscanada.ca/stories/zh/0337/) | 2级 |
| `SBC:0342` [惩罚](https://www.storybookscanada.ca/stories/zh/0342/) | 2级 |
| `SBC:0006` [阿南西和智慧](https://www.storybookscanada.ca/stories/zh/0006/) | 3级 |
| `SBC:0066` [诺孜贝儿和三根头发](https://www.storybookscanada.ca/stories/zh/0066/) | 3级 |
| `SBC:0110` [一粒小种子：旺加里·马塔伊的故事](https://www.storybookscanada.ca/stories/zh/0110/) | 3级 |
| `SBC:0141` [鸡和千足虫](https://www.storybookscanada.ca/stories/zh/0141/) | 3级 |
| `SBC:0158` [母鸡和老鹰](https://www.storybookscanada.ca/stories/zh/0158/) | 3级 |
| `SBC:0201` [驴孩子](https://www.storybookscanada.ca/stories/zh/0201/) | 3级 |
| `SBC:0315` [萨可满的歌声](https://www.storybookscanada.ca/stories/zh/0315/) | 3级 |
| `SBC:0324` [离家进城的那一天](https://www.storybookscanada.ca/stories/zh/0324/) | 3级 |
| `SBC:0072` [指蜜鸟的复仇](https://www.storybookscanada.ca/stories/zh/0072/) | 4级 |
| `SBC:0243` [和奶奶一起过暑假](https://www.storybookscanada.ca/stories/zh/0243/) | 4级 |
| `SBC:0291` [福思的姐姐说了什么](https://www.storybookscanada.ca/stories/zh/0291/) | 4级 |
| `SBC:0294` [奶奶的香蕉](https://www.storybookscanada.ca/stories/zh/0294/) | 4级 |
| `SBC:0052` [辛波薇亚](https://www.storybookscanada.ca/stories/zh/0052/) | 5级 |
| `SBC:0262` [玛格威](https://www.storybookscanada.ca/stories/zh/0262/) | 5级 |

## 后续记录模板

新增候选记入对应状态表，保持每个“平台＋ID”只有一条当前结论；不能只在聊天或被Git忽略的临时缓存里记下淘汰理由。仅看过元数据/封面的候选，可以另建“待全文审核”小节，但不能混入已审核通过或不收录表。

| 字段 | 应填写内容 |
| --- | --- |
| 平台＋书籍ID、标题与链接 | 能定位具体语言/译本；同名书不能合并。 |
| 来源级别、语言与版本 | 保留原站体系；已确认时记录译者、源文件哈希或版本信息；不猜测年龄。 |
| 状态与审核日期 | 标明是否已经导入；复审写旧结论→新结论及日期。 |
| 审核范围 | 元数据初筛、完整正文、知识附页、逐页插画、署名、音频分别做到哪一步。 |
| 具体理由与证据 | 认字/理解、故事/文体、插画、事实、图文、适读性与书库互补价值；问题尽量给原页码和原句，保留详细报告链接。 |
| 修订与复审条件 | 需要核实什么、改到什么程度、什么需求变化才重新考虑；不能只写“以后再看”。 |
| 图文音各自许可与署名 | 已核实与未核实分别写；没有录音不等于音频漏导入，已确认不匹配的资料不能虚构补齐。 |

### 结论变化记录

本次只汇总既有结论、合并重复ID并按阻碍整理复审条件，没有推翻既有审核，也未导入新书。后续在此追加实际发生的变化，例如“日期｜平台＋ID｜旧结论→新结论｜触发条件、版本变化与新证据链接”。审核范围或证据不足时保持待审，不把导入成功当作质量通过。

[首轮]: storyweaver-selection-2026-11-03.md
[四级]: storyweaver-level4-review-2026-11-04.md
[试读]: acceptance.md#storyweaver-92448-trial
