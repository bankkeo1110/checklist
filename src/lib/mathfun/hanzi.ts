// A curated set of common Chinese characters used to build the virtual
// keyboard's pinyin -> hanzi candidate map. pinyin-pro derives the (correct)
// pinyin for each character at runtime, so this only needs to be a list of
// valid, frequently used characters. Good enough for a learner-focused IME.
const FREQUENT =
  '的一是不了人我在有他这中大来上国个到说们为子和你地出道也时年得就那要下以生会自着去之过家学对里后小么心多天而能好都然没日于起还发成事只作当想看文无开手十用主行方又如前所本见经头面公同三已老从动两长知民样现分将外但身些与高意进把法此实回二理美点月首题必太真图边压干';

const EVERYDAY =
  '谢请问吗名字水火山田口日月木金土爸妈哥姐弟妹门书车电话机场飞航火站医院校师朋友爱喜欢吃喝饭菜茶米面包鱼肉蛋果苹香蕉牛羊猪狗猫鸟花草树林河海空云雨风雪冷热暖凉红黄蓝绿黑白色左右东西南北远近快慢早晚今昨明星期钟秒岁买卖钱贵便宜少几百千万块角毛关走跑坐站睡觉笑哭听读写画唱跳玩息休病药累饿渴新旧丑胖瘦矮';

export const COMMON_HANZI: string[] = Array.from(
  new Set((FREQUENT + EVERYDAY).split('')),
).filter((c) => /[一-鿿]/.test(c));
