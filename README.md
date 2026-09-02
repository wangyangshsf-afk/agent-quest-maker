# Agent Adventures

Role & Goal

You are an expert Frontend & AI EdTech Developer. Build a fully interactive, single-page web application for an AI Enlightenment Course for 8-15 year-old students titled: 《什么是智能体？——让 AI 帮我完成一件事》 (What is an AI Agent? — Let AI Help Me Complete a Task).

The application functions as both an interactive 45-minute lesson presentation and a Real-Time Dedicated Agent Generator Platform featuring 8 core theme agents.

🎨 Visual & UI Design System

Target Audience: Students aged 8–15 and teachers projecting in classrooms.

Style: Gamified, bright, modern, high-contrast visual cards, friendly emojis, large legible fonts, playful animations (Framer Motion).

Tech Stack: React, Tailwind CSS, Lucide React Icons, Framer Motion, Web Speech API integration, Local State Management.

🧭 Core Concept & Philosophy

The Agent Framework: Goal (目标) → Action (行动) → Check (检查) → Improvement (改进)

Crucial Rule: AI is capable, but Humans must inspect, review, and make the final decision. (AI 可以很能干，但人类必须负责检查、判断和最终决定。)

📦 8 Core Dedicated Agent Themes (8大核心主题)

Include a pre-configured theme engine with 8 presets (plus custom):

🏕️ 春游筹备官 (Spring Trip Planner)

📚 班级图书管家 (Classroom Book Steward)

🔬 科学实验助手 (Science Experiment Assistant)

📅 每日学习计划官 (Daily Study Plan Officer)

📖 创意故事共创者 (Creative Story Co-creator)

🎪 校园义卖策划师 (School Charity Sale Planner)

🏃 运动会筹备指导 (Sports Day Assistant)

🛠️ 自定义专属智能体 (Custom Dedicated Agent)

📑 13-Slide Interactive Course Structure

Slide 1: Cover Page (封面)

Title: 什么是智能体？

Subtitle: 让 AI 帮我完成一件事 (45分钟沉浸互动课件)

Start button with pulse animation.

Slide 2: Journey Map (学习地图)

Visual roadmap showing 6 key learning milestones.

Interactive navigation: Arrow keys, spacebar, clickable dots, bottom control bar.

Slide 3-5: Situation & Distinction (情境引入 & 角色对比)

Spring Trip Situation: Introducing the challenge of planning a class spring trip.

Role Voting Game: 3 interactive choice cards.

Chat vs. Agent Comparison:

Normal AI Chat: Passive answer generator.

AI Agent: Active task executor that asks clarifying questions and checks limits.

Slide 6: Agent Loop Diagram (工作循环机制)

Animated 4-step diagram: Goal → Action → Check → Human Final Approval.

Highlighting human responsibility in red/gold badge.

Slide 7: Command Center (指挥台)

3 Input Fields: Activity Name (活动), Student Count (人数), Restrictions/Budget (限制条件/预算).

Voice Input: Microphones buttons next to inputs using Web Speech API (zh-CN).

Conflict & Error Detector: Automatically raises warnings if logical conflict detected (e.g., Budget = 20 RMB for 50 people).

Validation: Requires at least 1 input filled before proceeding.

Slide 8: Execution Animation (办事过程)

5-Step Progressive Step-by-Step Animation:

🎧 Listening to task requirements

🔍 Spotting missing information

📝 Breaking down action plan (Step 1, Step 2, Step 3)

🛡️ Running safety & sanity check

✨ Generating final execution proposal

Includes a "Replay Animation" button.

Slide 9: Detective Mode / Challenge (侦探模式/纠错挑战)

Interactive challenges showing simulated AI errors:

Challenge 1: Missing key info (No venue specified).

Challenge 2: Logical contradiction (Budget vs. Group size).

Guided 3-step action: "Find it 🔍 -> Ask it ❓ -> Fix it ✏️". Auto-fills back into Command Center.

Slide 10: Scene Creator / Theme Selection (场景创作 - 8大主题)

Grid display of the 8 Core Agent Themes.

Clicking a card pre-fills default values for the Agent Card without overwriting existing user edits.

Slide 11: Agent Workbench & Prompt Builder (成果卡与智能体生成)

Editable Agent Card:

Agent Name

Primary Goal

3-Step Action Plan

Check Mechanism & Guardrails

Generate System Prompt Button: Creates a structured, copyable Prompt block containing explicit rules: active questioning, check phase, and required human sign-off.

Launch Agent Modal Button: Opens the interactive live Agent Workbench.

Slide 12-13: Course Summary & Export (课程收束 & 出口任务)

Recap of the core 3 elements + Human Final Decision.

Prompt export & copy option.

Option to launch 智能体工厂.html in a new tab.

🤖 Interactive Agent Execution Engine (Modal System)

When student clicks "Launch Agent" from Slide 11:

Opens a dedicated Chat/Execution Modal tuned to the selected agent theme.

State Machine Engine (chatState):

collecting: Agent actively checks for missing info (Time, location, budget, etc.).

planning: Generates 3-step actionable strategy.

adjusting: Prompts student to review and edit constraints.

done: Asks human student for FINAL APPROVAL / SIGN-OFF.

Includes structured output boxes alongside chat message bubbles.

⚡ Functional & Quality Requirements

Fallback Readiness: If Voice Recognition is unavailable/denied, display clean graceful toast/alert and default to keyboard input.

State Persistence: Keep input states in React memory during slide navigation.

No External Backend Needed: Works completely standalone inside the browser via built-in rule engines & mock intelligence triggers, ensuring zero latency for classroom demonstrations.

Export Capabilities: Allow copying generated Prompts and downloading Agent Cards as formatted text/markdown.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://agent-quest-maker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4df2a0ff-f97c-4fb7-8004-6e8c2dccfd6c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
