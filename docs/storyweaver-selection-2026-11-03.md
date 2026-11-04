# StoryWeaver 本轮选书与校订记录

审核日期：2026-11-03。面向当前主要读者：5岁、约认识400个汉字，以iPad亲子阅读为主。

本文保留当轮审核证据和结论。扩库时先查 [绘本审核台账](book-review-register.md)，获取按ID去重后的当前结论与复审条件，不将历史表格直接当作待导入清单。

## 结果与审核口径

- 从简体中文目录前100本的元数据中挑出55本，逐本读取完整正文、附页与署名。另对照《了解恐龙》的英文原版核实物种，不把它重复计作一本候选。没有声称审核了平台全部410本。
- 本轮选入35本新书，保留原有《绘画游戏》，StoryWeaver合计36本；与Storybooks Canada原有40本合计76本。另20本不在本轮导入，原因见后表。
- 文字审核看重复句支架、日常可迁移词、长段落负担、译文自然程度；故事审核看人物目标、因果、转折、幽默、情绪与主题新增价值。观察/诗歌/百科有独立价值，不强行按“有情节”唯一标准淘汰。
- 对入选书逐本看完整原版插画联系图，重点页再放大核对图文、数字、物种和动作；本报告列出的画面特点来自实际图像观察。没有用平台Verified、封面、作者名或绘者名代替全文与看图。
- 新增的35本为StoryWeaver 1级13本、2级9本、3级13本。2～3级共22本，增加科普、传记、城市文化、数学及较长故事；1级只保留有明显故事、观察或审美价值的特色书。未为凑高难度选入不合格4级书。
- 全部保留“来源体系＋级别”。StoryWeaver 2级与Storybooks Canada 2级不是统一标准；不同汉字数也不能换算成年龄、掌握程度或本站等级。

## 实际文字与资源增量

统计基于本次校订后的`data/books.json`正文，使用Unicode `Script=Han`字符去重；含书后知识与活动文字，不含书名、界面、简介和署名。跨书的字只计一次。

| 范围 | 本数 | 正文/活动页 | 不同汉字 |
| --- | ---: | ---: | ---: |
| 原Storybooks Canada | 40 | 420 | 1,230 |
| 本轮新增StoryWeaver | 35 | 478 | 1,614 |
| StoryWeaver（含原《绘画游戏》） | 36 | 490 | 1,614 |
| 现有全部书库 | 76 | 910 | 1,894 |

相对原40本，整库增加664个此前未出现的汉字；相对此前41本，增加654个。原《绘画游戏》的字已经被新增书覆盖，所以两行StoryWeaver字种数恰好相同。这些是书库覆盖数，不代表孩子学会或需要一次学习多少字。

新增35本含45页无字插画页和1页原本就没有插画的文字页。没有丢弃这些页，也没有为无字页编造故事。新增512张原JPG（含35张封面），合计109,836,962字节，约109.84MB／104.75MiB；这是本地素材文件大小，不是设备缓存配额保证。

## 逐本入选理由

以下“不同字”按本书正文单独去重，不能横向相加；页数包含原有无字页、知识和活动页，不含封面与版权页。低字数不自动代表低价值，例如《聪明的欧文》主要通过连续图画讲述。

### StoryWeaver 1级（13本）

| 书名（原站） | 本站主题 | 页 | 不同字 | 认字支点 | 故事/文体价值 | 实际画面特点 |
| --- | --- | ---: | ---: | --- | --- | --- |
| [忙碌的蚂蚁](https://storyweaver.org.in/en/stories/18612-mang-lu-de-ma-yi) | 自然探索 | 11 | 145 | 大小、快慢、队伍；短句可预测 | 跟蚂蚁找食物、传信、钻缝，观察有趣 | 微观蚂蚁与孩子大尺度对比，能边看边找 |
| [我不害怕！](https://storyweaver.org.in/en/stories/18671-wo-bu-hai-pa) | 成长故事 | 11 | 61 | “是谁/是什么/不害怕”反复 | 把未知影声认成熟悉人和事 | 深蓝夜色、叶影和藏着的猫，气氛统一 |
| [伦蒂：做梦的女孩](https://storyweaver.org.in/en/stories/19019-lun-di-zuo-meng-de-nv-hai) | 想象冒险 | 16 | 167 | 云朵、脚丫、排队；具体动作 | 任务与白日梦交织，结尾接纳想象 | 柔和天空、云中动物、行走动作连贯 |
| [我的鱼！不，我的鱼！](https://storyweaver.org.in/en/stories/19271-wo-de-yu-bu-wo-de-yu) | 想象天地 | 11 | 116 | 鱼、池塘、我的；短对话 | 争抢同条鱼，鱼儿反击形成幽默反转 | 漫画表情夸张，钓鱼动作与争抢容易观察 |
| [现在不行，现在不行！](https://storyweaver.org.in/en/stories/19272-xian-zai-bu-xing) | 家人与我 | 7 | 92 | “现在不行/我问……”反复 | 失望到生日惊喜，有悬念和情绪变化 | 彩色圆形构图与表情，揭晓页有庆祝感 |
| [寻找另一个自己](https://storyweaver.org.in/en/stories/20570-xun-zhao-ling-yi-ge-zi-ji) | 成长故事 | 14 | 84 | “和我一样”；身体与能/不能 | 寻找相同者后发现自己的独特性 | 小驴、镜面/水面与局部身体细节有呼应 |
| [我第一天上学](https://storyweaver.org.in/en/stories/20873-rani-first-day-at-school) | 成长故事 | 6 | 111 | 妈妈、手、学校；日常动作 | 从不舍到安心入校，分离情绪细腻 | 牵手、表情、校门和人群变化帮助读情绪 |
| [太大了，太小了](https://storyweaver.org.in/en/stories/21482-tai-da-le-tai-xiao-le) | 家人与我 | 13 | 86 | 太大/太小、能/不能反复 | 能力困惑到“不大不小刚刚好” | 家庭成员抱背、床与衣裙，大小关系具体 |
| [基乌的魔力](https://storyweaver.org.in/en/stories/99706-ji-wu-de-moli) | 生活发现 | 16 | 143 | 眼睛、形状、颜色；短句 | 看不清像魔法，戴眼镜后仍有想象 | 看见的模糊形状与现实对比，色彩和构图明确 |
| [小心！ 老虎来了！](https://storyweaver.org.in/en/stories/99713-xiaoxin-laohu-laile) | 自然探索 | 7 | 79 | 老虎、森林；警报拟声词 | 从老虎视角发现森林警报，有反转 | 动物漫画表情生动，老虎躲藏与众兽反应有趣 |
| [我们来玩吧](https://storyweaver.org.in/en/stories/99717-women-lai-wan-ba) | 生活发现 | 10 | 72 | 跑、游泳、骑车；规律短句 | 动作观察型读物，补充运动主题 | 运动姿势夸张鲜活，场景与动作一一对应 |
| [种星星](https://storyweaver.org.in/en/stories/577904-zhong-xingxing) | 自然探索 | 6 | 39 | 种、浇水、叶子、花蕾 | 种星星到星形花朵的短悬念 | 简洁线条与局部亮色，植物生长揭晓清楚 |
| [塔拉和魔法放大镜](https://storyweaver.org.in/en/stories/577905-ta-la-he-mofa-fangdajing) | 自然探索 | 6 | 54 | 草、虫、巨大；短诗和比较 | 放大镜带来新视角，短而有发现 | 明亮自然色、局部放大和巨物想象相互呼应 |

### StoryWeaver 2级（9本）

| 书名（原站） | 本站主题 | 页 | 不同字 | 认字支点 | 故事/文体价值 | 实际画面特点 |
| --- | --- | ---: | ---: | --- | --- | --- |
| [猴子遇干旱](https://storyweaver.org.in/en/stories/18453-hou-zi-yu-gan-han) | 想象天地 | 16 | 166 | 搬家、分享、家人；动作反复 | 干旱迁居、冲突到接纳，因果完整 | 干旱与新树林对比；猴群表情和互动鲜明 |
| [妮塔为什么倒挂着？](https://storyweaver.org.in/en/stories/19855-ni-ta-wei-shen-me-dao-gua-zhe) | 成长故事 | 15 | 157 | 外貌、性格；短页逐个认识朋友 | 从担心不一样到被接纳，温柔完整 | 头发、眼镜、身形和游戏场景支撑差异主题 |
| [去买书](https://storyweaver.org.in/en/stories/20012-qu-mai-shu) | 生活发现 | 9 | 126 | 大/小、厚/薄、现在/待会 | 孩子自主挑书，回家和爷爷共读 | 书架与书店细节丰富，家庭表情温暖 |
| [刷牙不好玩](https://storyweaver.org.in/en/stories/20032-shua-ya-bu-hao-wan) | 生活发现 | 13 | 193 | “先做一件事”；清洁收拾词 | 用游戏和哼歌化解无聊，贴近生活 | 人物和狗的动作灵活，留白便于看清细节 |
| [小猪的尾巴逃跑了](https://storyweaver.org.in/en/stories/65113-xiaozhu-de-weiba-taopao-le) | 想象冒险 | 16 | 261 | 重复问答、叠词拟声；多种地形 | 找尾巴变成试尾巴，结尾接纳改变 | 森林、城市、海底、山顶多场景；小猪富表情 |
| [法蒂和汤锅](https://storyweaver.org.in/en/stories/99710-fa-di-he-tangguo) | 生活发现 | 22 | 198 | 一二三、搅汤；重复观察句 | 偷吃与碗里无肉构成自然后果 | 人物动作细腻；搅汤、偷看和偷吃可逐页追踪 |
| [贾尼丝的唐人街之行](https://storyweaver.org.in/en/stories/99711-jia-ni-si-de-tangrenjie-zhi-xing) | 世界文化 | 12 | 229 | “下一站/买什么”；购物物品 | 三站购物到带走“记忆”，亲情转折 | 灯笼、店铺、寺庙和街景层次丰富 |
| [一起制作青柠汁吧！](https://storyweaver.org.in/en/stories/99720-yiqi-zhizuo-qing-ning-zhi-ba) | 数学游戏 | 15 | 223 | 平均、等份、一半；实物分数 | 分享饮料、合作调制，有完整任务 | 人物水彩感温暖；量杯与青柠切分可核对 |
| [聪明的欧文](https://storyweaver.org.in/en/stories/577893-congming-de-owen) | 成长故事 | 6 | 19 | 仅19个不同汉字；观察讲述为主 | 书与想象赶走“无知怪”，精选例外 | 蜡笔/拼贴感的书本、面具和想象泡泡连续推进 |

### StoryWeaver 3级（13本）

| 书名（原站） | 本站主题 | 页 | 不同字 | 认字支点 | 故事/文体价值 | 实际画面特点 |
| --- | --- | ---: | ---: | --- | --- | --- |
| [举重公主](https://storyweaver.org.in/en/stories/99715-juzhong-gongzhu) | 成长故事 | 16 | 301 | 训练、比赛、冠军；动作链 | 公主为自己成为冠军，结尾有力量 | 暖色块和举重动作有张力，角色体态鲜明 |
| [一名舞蹈家的故事](https://storyweaver.org.in/en/stories/266338-the-story-of-a-dancer) | 成长故事 | 14 | 324 | 跳、转、练习；传记动作词 | 学舞、远行、回乡再帮助更多孩子 | 舞姿、舞台与成长阶段视觉连贯 |
| [南亚鸨，一路顺风](https://storyweaver.org.in/en/stories/266344-fly-safe-godavan) | 自然探索 | 16 | 412 | 鸟蛋、孵化、草原、保护 | 护蛋误会到幼鸟成长，生态情节有转折 | 草原、鸟蛋、母鸟与幼鸟，成长变化清楚 |
| [你的酒窝呢？](https://storyweaver.org.in/en/stories/266363-where-did-your-dimples-go) | 科学探索 | 15 | 339 | 卷发、酒窝、特征、遗传 | 由家人相像谈到独一无二，有幽默 | 家庭表情、猫毛色及亲缘图帮助理解抽象概念 |
| [了解恐龙](https://storyweaver.org.in/en/stories/266369-discovering-dinosaurs) | 科学探索 | 15 | 259 | 大小、高矮、比较；物种名较难 | 百科比较型，不冒充情节故事 | 用公园、房屋和物体对比尺度，恐龙造型多样 |
| [地球呼叫阿鲁](https://storyweaver.org.in/en/stories/266388-earth-calling-aru) | 自然科普 | 19 | 310 | 飞、落、地球、质量；拟人对话 | “关闭引力”的假想实验有因果和幽默 | 高对比色与漂浮物体，抽象引力变得可观察 |
| [去看蜘蛛咯！](https://storyweaver.org.in/en/stories/266409-off-to-see-spiders) | 自然科普 | 22 | 363 | “出发去看蜘蛛”；形态和方位 | 沿路发现不同蜘蛛，从害怕到好奇 | 蛛网、树皮、花叶与观察者视线细节多 |
| [在外太空的古尔](https://storyweaver.org.in/en/stories/266453-gul-in-space) | 自然科普 | 18 | 413 | 吃饭、洗头、睡觉；太空词 | 生日太空旅程，用日常作息串联 | 星空与失重场景富想象，猫与宇航员互动鲜明 |
| [魔幻眼镜](https://storyweaver.org.in/en/stories/266456-the-magical-glasses) | 自然探索 | 13 | 362 | “是什么/让我看”；动物词 | 对话与猜谜把物种知识串成故事 | 亮丽层叠色彩；动物局部、全貌和环境相互呼应 |
| [星光之旅](https://storyweaver.org.in/en/stories/266466-the-starlight-adventure) | 想象冒险 | 19 | 392 | 方向、情绪、飞船；拟声词 | 找月亮、助人、遇险再回家的冒险 | 宇宙深色画面、奇幻角色精细；保留星图编号 |
| [奶奶去公园的路](https://storyweaver.org.in/en/stories/267081-nani-s-walk-to-the-park) | 家人与我 | 29 | 285 | 巷名反复；生活、方位、亲情 | 赶路到理解奶奶，社区故事温暖 | 密集街巷与店铺细节；无字页留出观察节奏 |
| [我喜欢这样的雨](https://storyweaver.org.in/en/stories/412394-wo-ruhe-xihuan-wo-de-yu) | 自然探索 | 7 | 96 | 雨、水、草木；短诗有节奏 | 感官自然诗，补充文体而非冒险 | 细密雨线、植物与昆虫，画面和诗意贴合 |
| [安娜的非凡天气实验](https://storyweaver.org.in/en/stories/412676-anna-de-qimiao-tianqi-shiyan) | 科学探索 | 17 | 323 | “书籍”反复；仪器与气象词 | 从生日要书到科学研究，愿望呼应 | 人物表情、书堆和仪器实物，传记不枯燥 |

## 本轮未导入的20本

“暂缓”不等于作品本身差。可能是当前版本译文、资料完整性、5岁适龄性、识字新增价值，或需要超过本轮轻校范围的图文联动修订。保留后续重新评估空间，不拆掉难处理的正文来凑一本“完整书”。

| 书名（原站） | 来源级别 | 本轮不选的主要原因 |
| --- | --- | --- |
| [姐姐，姐姐，雷声从哪来](https://storyweaver.org.in/en/stories/18535-jiejie-jiejie-leisheng-cong-na-lai) | StoryWeaver 3级 | 反复出现体罚笑话、雨中玩会感冒等表述；科学说明与措辞修订成本较高。 |
| [尼玛今天吃什么](https://storyweaver.org.in/en/stories/19535-ni-ma-jin-tian-chi-shen-me) | StoryWeaver 2级 | 实际图中草莓却标“荔枝”，图的署名也矛盾；附录多项漏译，无法可靠轻校补全。 |
| [姐姐，姐姐，太阳晚上去了哪里？](https://storyweaver.org.in/en/stories/20050-jie-jie-jie-jie-tai-yang-wan-shang-qu-le-na-li) | StoryWeaver 3级 | 文字有诗意，昼夜解释也有价值；实际恶魔尖牙大眼近景对当前5岁目标可能过于惊吓，留给更大年龄候选。 |
| [印度冬天里的热茶和温暖的地毯](https://storyweaver.org.in/en/stories/20439-hot-tea-and-warm-rugs-in-india-during-the-winter-season) | StoryWeaver 2级 | “muffler→消声器”、乱码和大批英语残留，核心意思需重译。 |
| [孔雀与大树](https://storyweaver.org.in/en/stories/20806-peacocks-and-pakodas) | StoryWeaver 2级 | 文化内容有价值，但“湿地球”等错译与未译词贯穿，不宜直接认读。 |
| [一个红风筝](https://storyweaver.org.in/en/stories/20957-yi-ge-hong-feng-zheng) | StoryWeaver 1级 | 马车、追逐等关键句不通顺，不能猜原文来修补押韵故事。 |
| [法蒂和青蛇](https://storyweaver.org.in/en/stories/99708-fa-di-he-qing-she) | StoryWeaver 2级 | 遇蛇惊吓、父亲棍子追蛇及反复告诫为主；情节相对单薄，保留后备。 |
| [向上世界，向下世界](https://storyweaver.org.in/en/stories/99736-xiangshang-shijie-xiang-xia-shijie) | StoryWeaver 3级 | 同名多种译法、未译英文、错词语病密集，需整书重译而非轻校。 |
| [遗失水的案例](https://storyweaver.org.in/en/stories/99743-yishi-shui-de-anli) | StoryWeaver 4级 | 把水库/蓄水池译为水缸、堤坝译为外滩等系统性术语错译，L4也不等于值得导入。 |
| [伸出你的舌头！](https://storyweaver.org.in/en/stories/99794-shen-chu-ni-de-shetou) | StoryWeaver 2级 | 舌头永不疲倦疼痛、北极熊蓝舌吸热等科普表述有疑点，多处内容需重审。 |
| [那是什么味道？](https://storyweaver.org.in/en/stories/99798-na-shi-shenme-weidao) | StoryWeaver 3级 | 故事悬念好，但酥油归为腌制食物、包装食品变质最慢等科学与译文问题尚未可靠解决。 |
| [一起去收集种子吧！](https://storyweaver.org.in/en/stories/266371-let-s-go-seed-collecting) | StoryWeaver 3级 | 故事好，但香蕉种子泛化、多个拉丁学名错误等需进一步核科学和重校附录。 |
| [阿咘的大地震](https://storyweaver.org.in/en/stories/266418-apu-s-giant-earthquake) | StoryWeaver 3级 | 躲床下、近出口就外跑等避震动作与插图联动；不能仅改附页来修正低龄安全示范。 |
| [懒惰的舅舅](https://storyweaver.org.in/en/stories/266437-lazy-mama) | StoryWeaver 3级 | VR故事有反转，但儿童使用安全、眼动传感器及术语起源等说明需额外核实。 |
| [大山中的小鸟](https://storyweaver.org.in/en/stories/412162-dashan-zhong-de-xiao-niao) | StoryWeaver 3级 | 给伤鸟敷泥和喂食等救助动作贯穿故事，无法靠局部文字提示修复。 |
| [狐狸和公鸡](https://storyweaver.org.in/en/stories/412364-huli-he-gongji) | StoryWeaver 3级 | 短情节说理较单线，结尾狐狸吃公鸡与家人；相对其他候选新增趣味和情绪层次较弱。 |
| [穿越时空的河](https://storyweaver.org.in/en/stories/412423-chuanyue-shikong-de-he) | StoryWeaver 3级 | 历史、污染和河流术语机翻密集，核心因果需系统重审。 |
| [爸爸的爱好](https://storyweaver.org.in/en/stories/577649-baba-de-aihao) | StoryWeaver 1级 | 生活笑点不错，但本轮导出资料中署名/翻译角色不够一致；先补齐来源再说。 |
| [一团棉花糖](https://storyweaver.org.in/en/stories/577900-yi-tuan-mianhua-tang) | StoryWeaver 1级 | 原书整本无字，不是漏抓文字；不为满足中文书数量擅自编写正文。 |
| [睡觉吧](https://storyweaver.org.in/en/stories/577907-shuijiao-ba) | StoryWeaver 1级 | 插画可看、适合睡前，但仅12个不同汉字；相对已有书库，本轮新增价值较弱。 |

## 校订边界与核对实例

保留逐页原文，不重新写故事或改掉原作核心情节。允许简繁统一、错字、标点、段落、断词和自然语序的小修；会影响知识准确性的局部修订，另保留依据。需要整书重译、重画或改变关键行为的书，先不导入。

| 实例 | 处理与依据 |
| --- | --- |
| 《奶奶去公园的路》 | “温柔的呼唤”改为“温柔地呼唤”，“我是时候走了”改为“我该走了”；不改社区路线和亲情结局。 |
| 《伦蒂：做梦的女孩》 | 原图是抱桶通过门槛，并非爬过房顶；将“爬过……房子”校为“悄悄穿过……屋子”。 |
| 《一起制作青柠汁吧！》 | 对照量杯图中的7份水＋2份青柠汁＋1份糖，核对十分配比；四分/八分切块活动按原图校正问题，保留实际分数。 |
| 《去看蜘蛛咯！》 | 八只眼改为“多数还有八只眼睛”，丝囊误译修为纺器；依据[澳大利亚博物馆眼睛介绍](https://australian.museum/learn/species-identification/ask-an-expert/what-do-spiders-look-like/)、[身体结构](https://australian.museum/learn/animals/spiders/spider-structure/)与[狼蛛卵袋](https://australian.museum/learn/animals/spiders/wolf-spiders/)。 |
| 《地球呼叫阿鲁》 | 质量不是“微粒数”，改成儿童层面的物质多少；区分公转周期与笼统的日期/季节归因。依据[NASA术语表](https://spaceplace.nasa.gov/glossary/en/)和[地球资料](https://science.nasa.gov/earth/facts/)。地球说话、关闭引力仍明确是幻想。 |
| 《在外太空的古尔》 | “必须吞牙膏”改为可以吐进毛巾；把失重范围收窄到在轨空间站，不说全部太空没有引力。依据[NASA太空卫生](https://www.nasa.gov/podcasts/houston-we-have-a-podcast/space-hygiene/)和[微重力说明](https://www.nasa.gov/centers-and-facilities/glenn/what-is-microgravity/)。 |
| 《星光之旅》 | 1922年“划分88个星座”改为“确定88个星座名单”，依据[IAU说明](https://iauarchive.eso.org/public/themes/constellations/)；原星图1～9定位编号留在图上，对照文字也完整保留。 |
| 《了解恐龙》 | 对照英文原作与物种资料，区分翼龙/海洋爬行动物与恐龙、现代鸟类与非鸟类恐龙；核对Shuvuuia，不因中文名相似误换成Ornithomimus。依据[AMNH分类](https://www.amnh.org/dinosaurs/types-of-dinosaurs)、[恐龙事实](https://www.amnh.org/dinosaurs/dinosaur-facts)、[NHM鸟面龙](https://www.nhm.ac.uk/discover/dino-directory/shuvuuia.html)。 |
| 《你的酒窝呢？》 | 避免把所有个体特征简单写成父母一对一遗传；依据[NHGRI特征解释](https://www.genome.gov/genetics-glossary/Trait)，不把绘本当作推断亲缘或单基因遗传的教材。 |
| 《安娜的非凡天气实验》 | 传记对照[WMO安娜·玛妮资料](https://wmo.int/media/news/celebrating-pioneer-indian-meteorologist-anna-mani)，区分探空气球与它搭载的臭氧测量仪器，不重写人物经历。 |
| 《刷牙不好玩》 | “消灭细菌”收窄为清洁、洗掉脏东西和病菌；20秒搓洗与[CDC洗手步骤](https://www.cdc.gov/clean-hands/about/index.html)一致，不新增医疗效果承诺。 |

科普用语已做资料交叉核对，但本轮并非教师、临床或领域专家逐条背书。真实人物、动物专名及长知识附页适合家长陪读；可根据孩子的理解反馈再校订。

## 图文、声音与来源怎样保存

- **原图**：原站JPG字节原样保存；`imageFrame`只改变阅读时显示的外围留白，不重画、不生成中文覆盖图。像星图编号这种与图中位置相关的文字，使用`imageLabels`保留位置关系，不能简单挪成一串正文数字。
- **完整页序**：无字页使用`wordless: true`并保留原插画；《刷牙不好玩》原第5页使用`textOnly: true`显示原文字，不造图补空。知识页和活动页也保留，不只抽出短故事正文。
- **没有故事录音**：本批均显式记录`narration: "none"`。阅读器保留翻页、进度、单字求助/收藏与离线下载，隐藏不存在的整页录音入口。单字声音来自设备中文TTS，不是原站真人故事朗读；没有可用设备声音时请家长帮助。
- **分别署名**：文字译者、原作作者、绘者、原出版社及译文版权人按每书版权页核对；不把同平台的角色硬套到另一本。此次入选文字和插画分别核对CC BY 4.0，未复用朗读视频，不把视频的不同许可混入。

| 维护位置 | 可核对内容 |
| --- | --- |
| [`data/storyweaver/`](../data/storyweaver/) | 每书逐页`originalText`与校订`text`、`textEdits`原因、`editorialReview`、原书完整署名文字`sourceAttribution`、来源级别、每图原URL/许可/版权与SHA256。 |
| [`assets/sources.json`](../assets/sources.json) | 实际发布图像清单、字节量、哈希、逐书文字与插画组件来源、版权、许可及元数据文件哈希。 |
| [`data/books.json`](../data/books.json) | 网站实际书目和页序，包括无字、纯文字页及本地素材路径。 |
| [`data/book-notes.json`](../data/book-notes.json) | 本站编写的主题、简介、关键词及亲子提问，独立于原著正文。 |
| [`scripts/import-storyweaver.mjs`](../scripts/import-storyweaver.mjs) | 仅导入已审本地清单；`npm run assets:storyweaver`复用已下载且哈希匹配的素材。来源变化时先核对，不静默替换。 |

55本候选的浏览器DOM与临时审阅工作稿留在被Git忽略的`.asset-cache/storyweaver-review/`，不是运行时依赖。正式入选的原文、修改记录、署名和事实依据已经写入上述版本控制文件；本报告保存未选书的取舍原因。

## 建议的试读路径

先试《小猪的尾巴逃跑了》《奶奶去公园的路》《去买书》《太大了，太小了》：能直观看到幽默、亲情和重复句的效果。再由兴趣进入《去看蜘蛛咯！》《魔幻眼镜》《了解恐龙》，较长科学段落由家长读。最后尝试《举重公主》《一名舞蹈家的故事》《安娜的非凡天气实验》等较长叙事。

这条路径按兴趣和文本负担组织，不是新的本站分级，也不要求先认识某个总字数才可以翻书。真实iPad上的字号、触摸、单字声音与离线体验仍需家庭实用反馈。
