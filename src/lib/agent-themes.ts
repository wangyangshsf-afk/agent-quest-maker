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
    id: "spring",
    emoji: "🏕️",
    name: "春游筹备官",
    en: "Spring Trip Planner",
    tint: "from-[oklch(0.93_0.09_150)] to-[oklch(0.96_0.05_120)]",
    activity: "五年级春游",
    count: "50人",
    limits: "每人预算 60 元，当天往返，需要老师陪同",
    askFor: ["去哪个地点", "几点出发、几点返回", "每人预算多少", "有没有同学过敏或晕车"],
    card: {
      name: "春游筹备官",
      goal: "帮五年级同学做一份安全、好玩又不超预算的春游方案",
      steps: [
        "收集信息：地点、人数、时间、预算、特殊需求",
        "制定方案：路线 + 时间表 + 分组 + 物品清单",
        "核对风险：交通安全、天气、过敏与走失预案",
      ],
      check: "预算不能超过每人 60 元；每 10 人配 1 位带队老师；方案必须由老师签字确认才能执行。",
    },
  },
  {
    id: "books",
    emoji: "📚",
    name: "班级图书管家",
    en: "Classroom Book Steward",
    tint: "from-[oklch(0.93_0.08_240)] to-[oklch(0.96_0.04_220)]",
    activity: "班级图书角管理",
    count: "42人 / 180 本书",
    limits: "每人一次最多借 2 本，借期 7 天",
    askFor: ["一共有多少本书", "每人能借几本", "借期多久", "谁来当值日管理员"],
    card: {
      name: "班级图书管家",
      goal: "让班级图书角借还清楚、不丢书、大家都能读到想读的书",
      steps: [
        "登记：给每本书编号并录入借阅表",
        "运行：每天午休开放借还，记录姓名与日期",
        "提醒：到期前一天生成催还名单",
      ],
      check: "每人同时最多借 2 本；丢书要先问同学再登记；名单公布前由图书委员核对。",
    },
  },
  {
    id: "science",
    emoji: "🔬",
    name: "科学实验助手",
    en: "Science Experiment Assistant",
    tint: "from-[oklch(0.93_0.08_195)] to-[oklch(0.96_0.04_190)]",
    activity: "小苏打与白醋火山实验",
    count: "6人小组",
    limits: "只能用教室里安全的材料，不能用明火",
    askFor: ["做什么实验", "有哪些材料", "分几组", "有没有危险步骤"],
    card: {
      name: "科学实验助手",
      goal: "带小组安全完成一次可以记录数据的科学小实验",
      steps: [
        "准备：列出材料清单与安全护具",
        "操作：写出可复现的步骤与观察记录表",
        "总结：整理数据，提出一个新问题",
      ],
      check: "禁止明火与未知化学品；每一步都要老师在场；结论必须有观察数据支持。",
    },
  },
  {
    id: "study",
    emoji: "📅",
    name: "每日学习计划官",
    en: "Daily Study Plan Officer",
    tint: "from-[oklch(0.94_0.09_75)] to-[oklch(0.97_0.05_85)]",
    activity: "工作日晚间学习计划",
    count: "1人",
    limits: "每天可用时间 90 分钟，21:30 必须睡觉",
    askFor: ["今天有哪些作业", "一共有多少空闲时间", "哪科最需要加强", "几点必须休息"],
    card: {
      name: "每日学习计划官",
      goal: "把今天的作业和复习安排进 90 分钟，不熬夜也不遗漏",
      steps: [
        "清点：列出全部任务并估计用时",
        "排序：先做难的，再做熟练的，穿插 5 分钟休息",
        "复盘：睡前打勾，记录哪一项超时",
      ],
      check: "总时长不得超过 90 分钟；21:30 后不安排任务；计划由本人确认后才生效。",
    },
  },
  {
    id: "story",
    emoji: "📖",
    name: "创意故事共创者",
    en: "Creative Story Co-creator",
    tint: "from-[oklch(0.93_0.08_20)] to-[oklch(0.96_0.05_35)]",
    activity: "科幻短篇《会做梦的机器人》",
    count: "3人共创",
    limits: "800 字以内，不能出现暴力情节",
    askFor: ["主角是谁", "故事发生在什么地方", "希望多少字", "想要什么结局风格"],
    card: {
      name: "创意故事共创者",
      goal: "和同学一起写出一个有转折、有温度的短篇故事",
      steps: [
        "设定：确定主角、场景、想解决的问题",
        "起草：写开头—转折—结尾三段草稿",
        "打磨：替换重复词语，加入一个细节镜头",
      ],
      check: "不出现暴力或吓人内容；不抄袭已有作品；最终版本由三位作者一起同意。",
    },
  },
  {
    id: "charity",
    emoji: "🎪",
    name: "校园义卖策划师",
    en: "School Charity Sale Planner",
    tint: "from-[oklch(0.93_0.09_330)] to-[oklch(0.96_0.05_340)]",
    activity: "校园爱心义卖日",
    count: "全班 45 人，预计顾客 300 人",
    limits: "摊位 2 个，义卖时间 2 小时，所有收入捐给图书室",
    askFor: ["卖什么", "有几个摊位", "义卖多长时间", "钱怎么记账和使用"],
    card: {
      name: "校园义卖策划师",
      goal: "办一场热闹又透明的义卖，把善款安全交给图书室",
      steps: [
        "选品：确定商品、定价与备货数量",
        "分工：收银、吆喝、补货、记账各就各位",
        "结算：当场公示收入并双人核对",
      ],
      check: "定价不超过 10 元；现金必须两人同时清点；款项去向由老师签字确认。",
    },
  },
  {
    id: "sports",
    emoji: "🏃",
    name: "运动会筹备指导",
    en: "Sports Day Assistant",
    tint: "from-[oklch(0.93_0.09_140)] to-[oklch(0.96_0.05_160)]",
    activity: "秋季运动会班级参赛",
    count: "45人，8个项目",
    limits: "每人最多报 2 项，比赛当天 3 小时",
    askFor: ["有哪些比赛项目", "每人能报几项", "谁负责后勤", "有没有同学身体不适"],
    card: {
      name: "运动会筹备指导",
      goal: "让每位同学都有事做，班级项目不漏报、不撞时间",
      steps: [
        "报名：统计意向并匹配项目",
        "排期：核对比赛时间，避免同一人撞场",
        "保障：安排加油、饮水、伤病应急",
      ],
      check: "每人最多 2 项；身体不适同学不安排剧烈项目；名单由体育委员和老师复核。",
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
