export type AgentTheme = {
  id: string;
  emoji: string;
  name: string;
  en: string;
  tint: string; // tailwind-safe class for card tint
  activity: string;
  count: string;
  limits: string;
  card: AgentCard;
  askFor: string[]; // info the agent will ask about in collecting phase
};

export type AgentCard = {
  name: string;
  goal: string;
  steps: [string, string, string];
  check: string;
};

export type Fields = {
  activity: string;
  count: string;
  limits: string;
};

export const THEMES: AgentTheme[] = [
  {
    id: "campus",
    emoji: "🎒",
    name: "校园日常小管家",
    en: "Campus Daily Manager",
    tint: "from-[oklch(0.93_0.09_150)] to-[oklch(0.96_0.05_120)]",
    activity: "初中生一周校园生活安排",
    count: "1人",
    limits: "每天7:30到校，16:30放学，课间10分钟，午休1小时",
    askFor: ["今天有几节课", "有没有早自习或晚自习", "中午在食堂吃还是回家吃", "放学后有没有社团或补习班"],
    card: {
      name: "校园日常小管家",
      goal: "帮同学把一天的课程、课间、午休和放学安排得井井有条，不迟到不漏事",
      steps: [
        "收集信息：今天几节课、有没有早自习、午休怎么安排、放学后有什么事",
        "制定方案：按时间轴排出到校→上课→课间→午休→放学的完整日程",
        "核对检查：课程有没有漏、课间转场够不够、放学要带的作业和物品列清单",
      ],
      check: "课程表必须和实际一致；课间10分钟只够收拾+上厕所，不能安排别的事；放学清单由本人核对后才能走。",
    },
  },
  {
    id: "money",
    emoji: "💰",
    name: "零花钱小管家",
    en: "Allowance Manager",
    tint: "from-[oklch(0.93_0.08_240)] to-[oklch(0.96_0.04_220)]",
    activity: "初中生月度零花钱管理",
    count: "1人",
    limits: "每月零花钱200元，包括吃饭、交通和购物，不能向家长额外要钱",
    askFor: ["这个月有多少零花钱", "有没有特别想买的东西", "每天吃饭交通大概花多少", "之前有没有超支过"],
    card: {
      name: "零花钱小管家",
      goal: "帮同学把零花钱分配清楚，该花的花、想存的存，不到月底就没钱",
      steps: [
        "收集信息：总额多少、必要花费有哪些、想买什么、有没有存钱目标",
        "制定方案：按50%必要+30%想要+20%储蓄分配，列出每周预算",
        "核对检查：每笔花费记下来，周末对账，超支就从下周想要里扣",
      ],
      check: "总花费不能超过零花钱总额；冲动消费必须等24小时再决定；存钱部分不到目标不动用。",
    },
  },
  {
    id: "fan",
    emoji: "⭐",
    name: "追星小助手",
    en: "Fan Activity Assistant",
    tint: "from-[oklch(0.93_0.08_195)] to-[oklch(0.96_0.04_190)]",
    activity: "初中生追星活动规划",
    count: "1-3人结伴",
    limits: "单次活动预算不超过300元，必须有家长知情，不能影响作业和睡眠",
    askFor: ["喜欢的偶像是谁", "最近有什么活动（演唱会/签售/线下）", "预算多少", "和谁一起去、家长知道吗"],
    card: {
      name: "追星小助手",
      goal: "帮同学开心追星又不影响学习，把时间、预算和安全都安排妥当",
      steps: [
        "收集信息：喜欢谁、有什么活动、时间地点票价、和谁去、预算多少",
        "制定方案：排出抢票→出行→现场→返程的完整流程，算清总花费",
        "核对检查：活动时间和学习冲突吗、预算够吗、出行安全吗、家长同意了吗",
      ],
      check: "演唱会/线下活动必须家长知情并同意；总花费不超过预算；不追私生、不堵酒店；作业必须先写完。",
    },
  },
  {
    id: "weekend",
    emoji: "📅",
    name: "周末规划师",
    en: "Weekend Planner",
    tint: "from-[oklch(0.94_0.09_75)] to-[oklch(0.97_0.05_85)]",
    activity: "初中生周末两天安排",
    count: "1人",
    limits: "周末有作业要完成，周日晚上21:30必须睡觉，至少留半天自由时间",
    askFor: ["这周末有多少作业", "有没有约同学或补习班", "想玩什么、去哪里", "有没有必须完成的事"],
    card: {
      name: "周末规划师",
      goal: "帮同学把周末的作业、休息和玩安排平衡，既不熬夜也不浪费时间",
      steps: [
        "收集信息：作业量多少、有没有约人、想玩什么、几点必须睡",
        "制定方案：按周六上午攻难作业→下午晚上玩→周日上午检查复习→下午自由的节奏排",
        "核对检查：作业时间够吗、留休息了吗、安排是不是太满、周日晚上能按时睡吗",
      ],
      check: "作业必须在周日晚饭前完成；至少留半天什么都不安排；21:30后不看手机；计划由本人确认才生效。",
    },
  },
  {
    id: "sports",
    emoji: "🏀",
    name: "运动打卡教练",
    en: "Sports Coach",
    tint: "from-[oklch(0.93_0.08_20)] to-[oklch(0.96_0.05_35)]",
    activity: "初中生课后运动打卡计划",
    count: "1人",
    limits: "每天运动30-60分钟，不能影响写作业，身体不舒服立刻停",
    askFor: ["想练什么项目（跑步/篮球/跳绳/骑行等）", "每周能练几天、每次多久", "有没有体测目标", "有没有伤病或身体不适"],
    card: {
      name: "运动打卡教练",
      goal: "帮同学制定能坚持的运动计划，养成锻炼习惯，体测不发愁",
      steps: [
        "收集信息：练什么、每周几次、每次多久、什么强度、有没有伤病",
        "制定方案：热身→主训练→放松三步走，排出每周打卡表，设小目标",
        "核对检查：运动前热身了吗、装备对吗、身体状态好吗、量是不是太大了",
      ],
      check: "每次运动必须先热身5分钟；出现头晕胸闷剧痛立刻停止；高温天不做户外运动；打卡记录由本人填写。",
    },
  },
  {
    id: "anime",
    emoji: "🛍️",
    name: "谷子购物助手",
    en: "Merch Shopping Assistant",
    tint: "from-[oklch(0.93_0.09_330)] to-[oklch(0.96_0.05_340)]",
    activity: "初中生二次元周边（谷子）购买规划",
    count: "1-2人结伴",
    limits: "每月吃谷预算100元，只买正版，不能影响吃饭和交通钱",
    askFor: ["喜欢什么IP（原神/光夜/柯南等）", "这个月预算多少", "想买吧唧/立牌/手办还是盲盒", "去线下店还是线上代购"],
    card: {
      name: "谷子购物助手",
      goal: "帮同学买到心仪的周边又不超预算，避开盗版和尾款地狱",
      steps: [
        "收集信息：喜欢什么IP、预算多少、想买什么类型、去哪里买",
        "制定方案：列购物清单+价格，按必要/想要排序，推荐购买渠道和路线",
        "核对检查：是正版吗、有没有超预算、有没有重复买、尾款时间记好了吗",
      ],
      check: "只买有官方防伪标的正版；总花费不超过月预算；预定的尾款必须记在日历上；买前先想24小时。",
    },
  },
  {
    id: "studyTour",
    emoji: "🏛️",
    name: "研学小向导",
    en: "Museum & Study Tour Guide",
    tint: "from-[oklch(0.93_0.09_140)] to-[oklch(0.96_0.05_160)]",
    activity: "上海博物馆/科技馆研学参观",
    count: "1-4人",
    limits: "半天到一天，必须提前预约，周一多数场馆闭馆",
    askFor: ["对什么主题感兴趣（历史/自然/科学/艺术）", "打算去多久、和谁去", "有没有想看的特展", "交通方式是什么"],
    card: {
      name: "研学小向导",
      goal: "帮同学规划博物馆和研学参观，学到东西又不累，还能盖章买文创",
      steps: [
        "收集信息：兴趣主题、时间、同行人数、有没有特展、交通方式",
        "制定方案：推荐场馆+特展，排出参观路线，标注预约方式和必看展品",
        "核对检查：预约了吗、周一闭馆吗、时间够看完重点吗、交通方便吗",
      ],
      check: "必须提前在官方渠道预约；周一不安排博物馆参观；参观时不触摸展品；研学报告由本人完成。",
    },
  },
  {
    id: "custom",
    emoji: "🛠️",
    name: "自定义专属智能体",
    en: "Custom Dedicated Agent",
    tint: "from-[oklch(0.94_0.03_260)] to-[oklch(0.97_0.02_260)]",
    activity: "",
    count: "",
    limits: "",
    askFor: ["你想让它完成什么任务", "涉及多少人", "有什么限制条件", "谁来最后检查"],
    card: {
      name: "我的专属智能体",
      goal: "（写下你想让它帮你完成的那件事）",
      steps: ["第一步：收集需要的信息", "第二步：做出可执行的方案", "第三步：检查并改进"],
      check: "（写下它不能做什么，以及谁来做最后决定）",
    },
  },
];

export const EMPTY_CARD: AgentCard = {
  name: "",
  goal: "",
  steps: ["", "", ""],
  check: "",
};

/** Simple rule-engine: detect logical conflicts in the command center. */
export function detectConflicts(f: Fields): string[] {
  const warn: string[] = [];
  const people = firstNumber(f.count);
  const money = firstNumber(f.limits);
  const hasMoney = /元|块|预算|费|¥|rmb/i.test(f.limits);

  if (people && hasMoney && money) {
    const perHead = /每人|人均/.test(f.limits) ? money : money / people;
    if (perHead < 5) {
      warn.push(
        `⚠️ 预算和人数可能冲突：${people} 人，人均只有约 ${perHead.toFixed(1)} 元，恐怕买不到水和门票。要不要提高预算，或减少人数？`,
      );
    }
  }
  if (f.activity && !f.count.trim()) {
    warn.push("❓ 还缺少「人数」：不知道多少人，就没办法分组和算钱。");
  }
  if (f.activity && !f.limits.trim()) {
    warn.push("❓ 还缺少「限制条件」：时间、预算、安全要求，至少告诉我一个。");
  }
  if (/春游|参观|出行|郊游|运动会|义卖/.test(f.activity) && !/地点|公园|馆|校|山|园|操场/.test(f.limits + f.activity)) {
    warn.push("📍 没有说明「地点」：地点不同，路线、时间和花费都会变。");
  }
  if (people && people > 200) {
    warn.push("👀 人数很多（超过 200 人），需要分批次和更多老师，请再确认一次。");
  }
  return warn;
}

export function firstNumber(s: string): number | null {
  const m = s.replace(/[，,]/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

export function buildPrompt(card: AgentCard, f: Fields): string {
  return `# 角色
你是「${card.name || "我的专属智能体"}」，一个为 8-15 岁学生服务的专属智能体。

# 目标
${card.goal || "（未填写）"}

# 背景信息
- 活动：${f.activity || "（未填写）"}
- 人数：${f.count || "（未填写）"}
- 限制条件：${f.limits || "（未填写）"}

# 行动步骤（必须按顺序执行）
1. ${card.steps[0] || "（未填写）"}
2. ${card.steps[1] || "（未填写）"}
3. ${card.steps[2] || "（未填写）"}

# 主动提问规则
开始行动前，如果缺少时间、地点、人数、预算或安全信息，必须先一次性列出问题问我，不要自己乱猜。

# 检查机制与安全边界
${card.check || "（未填写）"}
- 发现信息互相矛盾时，先指出矛盾，再给两个可选方案。
- 不编造不存在的价格、地址或数据；不确定就标注「需要核实」。

# 人类最终决定（必须遵守）
输出方案后，必须停下来问：「请你检查这份方案，确认无误后回复『通过』，我才算完成。」
未获得人类确认前，不得声称任务已完成。

# 输出格式
用小标题 + 短句列表，语言适合小学生阅读，最后附一份「需要人类确认的清单」。`;
}

export function cardToMarkdown(card: AgentCard, f: Fields): string {
  return `# 智能体成果卡：${card.name || "未命名"}

**目标**：${card.goal}

**背景**：活动 ${f.activity || "-"}｜人数 ${f.count || "-"}｜限制 ${f.limits || "-"}

**三步行动**
1. ${card.steps[0]}
2. ${card.steps[1]}
3. ${card.steps[2]}

**检查机制与护栏**
${card.check}

**人类最终决定**：方案必须由本人/老师检查签字后才能执行。
`;
}
