// ===== 中文每日一言语料库（60 条） =====
const QUOTES = [
  { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
  { text: '你所热爱的，就是你的生活。', author: '佚名' },
  { text: '人生如逆旅，我亦是行人。', author: '苏轼' },
  { text: '世界以痛吻我，要我报之以歌。', author: '泰戈尔' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '既然选择了远方，便只顾风雨兼程。', author: '汪国真' },
  { text: '天空没有翅膀的痕迹，但我已飞过。', author: '泰戈尔' },
  { text: '心之所向，素履以往。', author: '木心' },
  { text: '凡是过往，皆为序章。', author: '莎士比亚' },
  { text: '且将新火试新茶，诗酒趁年华。', author: '苏轼' },
  { text: '你来人间一趟，你要看看太阳。', author: '海子' },
  { text: '行到水穷处，坐看云起时。', author: '王维' },
  { text: '此心安处是吾乡。', author: '苏轼' },
  { text: '星光不问赶路人，时光不负有心人。', author: '佚名' },
  { text: '面朝大海，春暖花开。', author: '海子' },
  { text: '热爱可抵岁月漫长。', author: '佚名' },
  { text: '人生到处知何似，应似飞鸿踏雪泥。', author: '苏轼' },
  { text: '念念不忘，必有回响。', author: '李叔同' },
  { text: '愿你有好运，如果没有，愿你在不幸中学会慈悲。', author: '刘瑜' },
  { text: '万物皆有裂痕，那是光照进来的地方。', author: '莱昂纳德·科恩' },
  { text: '你微微地笑着，不同我说什么话。而我觉得，为了这个，我已等待很久了。', author: '泰戈尔' },
  { text: '醉后不知天在水，满船清梦压星河。', author: '唐珙' },
  { text: '最是人间留不住，朱颜辞镜花辞树。', author: '王国维' },
  { text: '桃李春风一杯酒，江湖夜雨十年灯。', author: '黄庭坚' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '天生我材必有用，千金散尽还复来。', author: '李白' },
  { text: '人生得意须尽欢，莫使金樽空对月。', author: '李白' },
  { text: '海上生明月，天涯共此时。', author: '张九龄' },
  { text: '但愿人长久，千里共婵娟。', author: '苏轼' },
  { text: '采菊东篱下，悠然见南山。', author: '陶渊明' },
  { text: '从前车马很慢，书信很远，一生只够爱一个人。', author: '木心' },
  { text: '满地都是六便士，他却抬头看见了月亮。', author: '毛姆' },
  { text: '生命中曾经有过的所有灿烂，终究都需要用寂寞来偿还。', author: '马尔克斯' },
  { text: '一个人可以被毁灭，但不能被打败。', author: '海明威' },
  { text: '活着本身就是一种胜利。', author: '余华' },
  { text: '世间好物不坚牢，彩云易散琉璃脆。', author: '白居易' },
  { text: '人生若只如初见，何事秋风悲画扇。', author: '纳兰性德' },
  { text: '山重水复疑无路，柳暗花明又一村。', author: '陆游' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游' },
  { text: '天行健，君子以自强不息。', author: '《周易》' },
  { text: '地势坤，君子以厚德载物。', author: '《周易》' },
  { text: '己所不欲，勿施于人。', author: '孔子' },
  { text: '三人行，必有我师焉。', author: '孔子' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '大道至简，大音希声。', author: '老子' },
  { text: '上善若水，水善利万物而不争。', author: '老子' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '子非鱼，安知鱼之乐？', author: '庄子' },
  { text: '人生天地之间，若白驹之过隙，忽然而已。', author: '庄子' },
  { text: '一花一世界，一叶一菩提。', author: '佛经' },
  { text: '色即是空，空即是色。', author: '《心经》' },
  { text: '宠辱不惊，看庭前花开花落。', author: '《菜根谭》' },
  { text: '去留无意，望天上云卷云舒。', author: '《菜根谭》' },
  { text: '腹有诗书气自华。', author: '苏轼' },
  { text: '莫愁前路无知己，天下谁人不识君。', author: '高适' },
  { text: '春风得意马蹄疾，一日看尽长安花。', author: '孟郊' },
  { text: '落红不是无情物，化作春泥更护花。', author: '龚自珍' },
  { text: '春蚕到死丝方尽，蜡炬成灰泪始干。', author: '李商隐' },
  { text: '此情可待成追忆，只是当时已惘然。', author: '李商隐' },
  { text: '玲珑骰子安红豆，入骨相思知不知。', author: '温庭筠' },
];

/**
 * 按日期确定性选择一言（同一天返回相同结果）
 * @returns {{ text: string, author: string }}
 */
function getDailyQuote() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const index = (year * 365 + month * 31 + day) % QUOTES.length;
  return QUOTES[index];
}
