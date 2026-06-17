# 寻味（Cookbook App）—— 项目规划文档 v1.0

> 给 Claude Code 阅读的开发说明书。请按本文档循序构建，遇到歧义优先询问而非自行假设。

---

## 0. 项目愿景

做一个让"做菜"变成一件**独具匠心**的事情的 Web App。

**问题**：做饭做多了会觉得麻木。
**解法**：用记录让一切真实可感——每一次复刻、每一次微调都被沉淀下来；同时帮你解决"今天到底吃什么"这件日常小事。

**项目代号**：`cookbook-app`（中文名"寻味"）

---

## 1. 技术栈

请严格使用以下技术栈，不要替换：

- **构建工具**：Vite
- **框架**：React 18 + TypeScript
- **路由**：React Router v6
- **状态管理**：Zustand（轻量、够用）
- **本地持久化**：IndexedDB（用 `idb` 或 `dexie` 包装），v1 不接后端
- **样式**：Tailwind CSS + CSS Modules（控件级样式）
- **Markdown 编辑器**：`@uiw/react-md-editor`（或同类，需支持实时预览）
- **Markdown 渲染**：`react-markdown` + `remark-gfm`
- **动画**：**GSAP 3**（核心，转场和拖拽都用它，不要混用 Framer Motion）
- **拖拽**：**GSAP Draggable + InertiaPlugin**（见 §6）
- **图标**：`lucide-react`
- **开发环境**：VS Code

```bash
npm create vite@latest cookbook-app -- --template react-ts
cd cookbook-app
npm i react-router-dom zustand idb gsap @uiw/react-md-editor react-markdown remark-gfm lucide-react
npm i -D tailwindcss postcss autoprefixer
```

> GSAP 3 的 Draggable 和 InertiaPlugin 现已免费（GSAP 商业许可变更后），可直接通过 npm 安装使用。

---

## 2. 目录结构

```
cookbook-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx                      # 路由根节点 + 全局转场容器
│   ├── routes/
│   │   ├── Home.tsx                 # 首页：今日推荐 + 入口
│   │   ├── RecipeList.tsx           # 菜谱列表
│   │   ├── RecipeDetail.tsx         # 菜谱详情 + 版本树
│   │   ├── RecipeEditor.tsx         # 新建/编辑菜谱（Markdown）
│   │   ├── VersionEditor.tsx        # 创建迭代版本（分支）
│   │   ├── WeekPlanner.tsx          # 一周菜单规划（拖拽）
│   │   └── Import.tsx               # 从外部导入菜谱
│   ├── components/
│   │   ├── transition/
│   │   │   └── CurveTransition.tsx  # 见 §5
│   │   ├── draggable/
│   │   │   ├── DraggableCard.tsx    # 见 §6
│   │   │   └── SortableList.tsx
│   │   ├── recipe/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── VersionTree.tsx      # 菜谱版本树（主干 + 分支）
│   │   │   ├── IngredientTable.tsx  # 可编辑用量表
│   │   │   └── MarkdownEditor.tsx
│   │   └── ui/                      # 基础控件（Button、Modal、Tag…）
│   ├── stores/
│   │   ├── recipeStore.ts           # 菜谱 CRUD + 版本
│   │   └── planStore.ts             # 周计划
│   ├── db/
│   │   ├── schema.ts                # IndexedDB schema
│   │   └── seed.ts                  # 内置菜谱种子数据
│   ├── types/
│   │   └── recipe.ts                # 全局类型定义
│   ├── lib/
│   │   ├── gsapSetup.ts             # GSAP 插件注册
│   │   └── recommender.ts           # "今天吃什么"算法
│   └── styles/
│       └── globals.css
├── public/
│   └── seed-recipes/                # 内置菜谱（markdown 文件）
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 3. 数据模型（TypeScript）

放在 `src/types/recipe.ts`：

```ts
// 菜谱主干
export interface Recipe {
  id: string;                  // uuid
  title: string;               // 菜名
  cover?: string;              // 封面图（base64 或 url）
  tags: string[];              // ["川菜", "快手", "宵夜"]
  source: RecipeSource;        // 来源
  bodyMd: string;              // 主版本 Markdown 正文（食材+步骤）
  rootVersionId: string;       // 指向 versions 中的"主干"版本
  createdAt: number;
  updatedAt: number;
  cookCount: number;           // 做过几次
  lastCookedAt?: number;
}

// 菜谱来源
export interface RecipeSource {
  type: 'builtin' | 'custom' | 'imported';
  url?: string;                // 导入时的原始 URL（小红书/B站/下厨房/书页扫描…）
  note?: string;               // 出处备注："《家常川菜》P.42"
  author?: string;
}

// 版本（迭代）—— 一棵以 rootVersionId 为根的树
export interface RecipeVersion {
  id: string;
  recipeId: string;            // 所属菜谱
  parentVersionId: string | null; // null = 主干根；否则指向父版本
  label: string;               // "微辣版" / "v2 减糖" / "妈妈做法"
  bodyMd: string;              // 该版本的完整 Markdown
  ingredients: Ingredient[];   // 结构化食材（便于调整用量）
  changeNote?: string;         // 这次改了什么（"糖减半，加一勺豆瓣"）
  createdAt: number;
  rating?: 1 | 2 | 3 | 4 | 5;  // 这版的自评
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;                // "g" | "ml" | "勺" | "个" …
}

// 周计划
export interface WeekPlan {
  weekStart: string;           // ISO 周一日期 "2026-05-18"
  slots: PlanSlot[];
}
export interface PlanSlot {
  id: string;                  // 用于 Draggable 标识
  date: string;                // ISO 日期
  meal: 'breakfast' | 'lunch' | 'dinner';
  recipeId?: string;
  versionId?: string;
  note?: string;
}
```

---

## 4. 三大核心功能（v1 必交付）

### 4.1 记录（Record）

#### 4.1.1 内置菜谱
- `public/seed-recipes/` 放 **8–10 个** 内置菜谱（Markdown 文件，YAML frontmatter 含 title/tags/ingredients）
- 首次启动时 `db/seed.ts` 自动写入 IndexedDB，标记 `source.type = 'builtin'`
- 建议内置：番茄炒蛋、麻婆豆腐、可乐鸡翅、葱油拌面、白灼菜心、宫保鸡丁、蒜蓉粉丝蒸虾、糖醋排骨

#### 4.1.2 自定义新建
- `RecipeEditor.tsx`：左侧 Markdown 输入，右侧实时预览
- 必填：标题、tags、bodyMd
- 选填：封面图（拖拽上传转 base64）

#### 4.1.3 从外部导入
**关键**：导入和自定义是**同一个编辑器**，只是预填了 `source` 字段。

- `Import.tsx`：表单含「URL」「出处备注」「作者」三个字段（URL 和备注**至少填一项**）
- 用户粘贴小红书/下厨房/微博/B 站链接 → 写入 `source.url`
- 用户输入书名页码 → 写入 `source.note`
- 提交后跳转到 `RecipeEditor` 让用户粘贴/编辑正文 Markdown
- v1 **不做** 自动抓取网页内容（避免 CORS 和反爬），完全由用户手动复制粘贴

#### 4.1.4 Markdown 支持
- 支持 GFM（表格、勾选框、代码块、删除线）
- 支持图片（base64 内嵌或外链）
- 编辑器要有：粗体/斜体/标题/列表/插入图片 快捷按钮

---

### 4.2 菜谱迭代（Version Tree）

> 这是本 App 的灵魂特性。务必认真实现。

#### 4.2.1 数据结构
- 每个 `Recipe` 关联多个 `RecipeVersion`，构成一棵**有向树**
- `parentVersionId === null` 的版本即"主干根"，记录在 `Recipe.rootVersionId`
- 任何版本都可以再分叉（孩子节点）

#### 4.2.2 UI 表现
- `RecipeDetail.tsx` 左侧：当前选中版本的正文（Markdown 渲染）+ 食材表
- 右侧：`VersionTree.tsx` ——
  - 树形可视化（用 SVG 画连线，主干竖直、分支斜出）
  - 主干用粗线、分支用细线、当前选中版本高亮发光
  - 每个节点显示 `label` + 星级评分
  - 点击节点切换正文显示
  - 节点右键/长按弹出菜单：「创建分支」「编辑」「设为主干推荐」

#### 4.2.3 食材表交互
`IngredientTable.tsx`：
- 表格形式展示 `Ingredient[]`
- 每行的 `amount` 是 input，可直接修改
- 顶部有「按比例缩放」滑块（0.5x – 3x），整列等比变化
- 修改后有「保存为新版本」按钮 → 弹出 modal 让用户填 `label` 和 `changeNote` → 创建子版本，`parentVersionId` 指向当前版本

#### 4.2.4 改动追溯
- 每个非根版本展示 `changeNote`：「这次改了什么」
- 详情页底部时间线列出本菜谱所有版本（按时间倒序）

---

### 4.3 规划和分享（Plan & Share）

#### 4.3.1 "今天吃什么"
位置：`Home.tsx` 顶部大卡片，一个圆形按钮 + 当日推荐。

算法（`lib/recommender.ts`）：
1. 从所有菜谱中过滤：最近 7 天没做过的优先
2. 按 `cookCount` 倒序加权（做过的更熟练，可优先推荐复刻）
3. 同时混入 20% 概率的"从未做过"菜谱，避免无聊
4. 点按钮 → 抽一个 → 用 GSAP 做翻牌动画（见 §5）

按钮交互：
- 单击：抽一道菜
- 长按：抽三道菜（一顿饭的组合：一荤一素一汤）
- 卡片下方有「就它了」（加入今日计划）和「换一个」

#### 4.3.2 一周菜单规划
`WeekPlanner.tsx`：
- 7 列 × 3 行的网格（周一到周日 × 早午晚）
- 每个格子是一个 `PlanSlot`
- **左侧抽屉**：可拖拽的菜谱卡片列表（搜索 + tag 筛选）
- 用户从抽屉**拖**菜谱到任一格子（GSAP Draggable，见 §6）
- 已填充的格子也可以**拖动调换**（两格内容交换）
- 格子右上角有 × 删除
- 顶部「← 上一周 / 本周 / 下一周 →」切换
- 顶部「一键生成本周」：用推荐算法把空格子填满

#### 4.3.3 分享（v1 简化版）
- 详情页右上角「分享」按钮 → 生成一张图（用 `html2canvas` 截当前菜谱卡片）→ 下载
- 不做账号系统、不做云端

---

## 5. 页面转场动效

**强制要求**：使用来自 [CodePen EaKpEpJ](https://codepen.io/GreenSock/pen/EaKpEpJ) 的曲面波浪（curve sweep）SVG 转场效果。

### 5.1 效果描述
- 一条 SVG 曲线从屏幕底部上扫，覆盖整屏（带渐变色填充）
- 中段曲线由 `Q` 控制点拉扯，形成弹性的"波浪覆盖"质感
- 覆盖到顶后，下一页内容已就绪，曲线再向上方退出

### 5.2 实现要点
封装到 `components/transition/CurveTransition.tsx`：

```tsx
// 伪代码骨架，请按 CodePen 源码精确还原 path 形变
<svg className="transition fixed inset-0 z-50 pointer-events-none"
     viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="99" y2="99">
      <stop offset="0.2" stopColor="rgb(255, 135, 9)" />
      <stop offset="0.7" stopColor="rgb(247, 189, 248)" />
    </linearGradient>
  </defs>
  <path ref={pathRef}
    d="M 0 100 V 100 Q 50 100 100 100 V 100 z"
    fill="url(#grad)" />
</svg>
```

动画 timeline（GSAP）：
1. 入场阶段：path 的 `d` 属性从底部一字直线 → 拉到中段隆起（Q 控制点 y 变为 0）→ 一字盖满（V 100 → V 0）
2. 路由切换发生在覆盖最盛的一帧
3. 出场阶段：path 从顶端继续向上，反向收回

颜色（暖橙→粉）可与主题色统一，建议改为更"厨房"的配色：
- 起色：`#F2A65A`（蛋黄油色）
- 终色：`#E8E4D8`（米白）

### 5.3 接入路由
在 `App.tsx` 用 React Router 的 `useLocation` 监听路径变化，触发 `CurveTransition.play()`。路由切换在 `onCoveredCallback` 中执行，避免页面闪烁。

---

## 6. UI 控件（拖拽）

**强制要求**：周菜单的所有拖拽来自 [CodePen azmKBBJ](https://codepen.io/GreenSock/pen/azmKBBJ) 的 GSAP Draggable 控件源码。

### 6.1 选择 dynamic 还是 true
**统一使用 `type: "x,y"` + `inertia: true`（即"dynamic"惯性版）**。
理由：周计划的拖拽需要符合手感的减速和吸附，惯性版用户体验更好。

### 6.2 注册
`lib/gsapSetup.ts`：
```ts
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(Draggable, InertiaPlugin);
```

### 6.3 SortableList 实现要点
- 拖拽时 `bounds` 限制为父容器
- `liveSnap.y`：根据每个槽位的中心 y 坐标做磁吸
- `onDragEnd` 触发数组重排，调用 `planStore.movSlot(fromId, toId)`
- 拖动中的卡片 `scale: 1.05` + 投影变深，让"被抓起"的感觉明确
- 其他卡片用 GSAP `to()` 做让位动画（300ms `power2.out`）

### 6.4 跨容器拖拽
菜谱抽屉 → 周计划格子：
- 抽屉里的卡片用 Draggable，clone 一份再拖（保留原位）
- 用 `hitTest()` 判断落点格子
- 命中 → 写入 `PlanSlot.recipeId`，clone 元素飞入并淡出

---

## 7. 视觉设计

**强制要求**：使用 frontend-design skill 的设计指引执行整体视觉。开发开始时 Claude Code 应先阅读 `/mnt/skills/public/frontend-design/SKILL.md`，遵循其中的设计 tokens、字体、留白和层次规则。

### 7.1 总基调
- 关键词：**温暖、手作感、留白、不浮夸**
- 灵感：日式食谱书 + 现代独立咖啡馆菜单
- 不要：商业外卖 App 的红黄配色 / 过多渐变 / 玻璃拟态

### 7.2 配色建议（可调）
- 主背景：`#FAF7F2`（米纸白）
- 主文本：`#1F1B16`
- 强调色：`#C2410C`（焦糖橙）
- 次要色：`#3F6B4E`（橄榄绿）
- 分隔线/弱：`#E7E1D6`

### 7.3 字体
- 中文：`"Source Han Serif SC"` / `"Noto Serif SC"`（衬线，标题用）
- 中文正文：`"PingFang SC"` / `"Inter"`
- 数字与英文：`"Inter"`（用量、日期）

### 7.4 排版细节
- 标题用衬线、正文用无衬线，对比制造"书页感"
- 行高放大到 1.7（中文阅读舒适）
- 卡片圆角 `12px`，阴影低对比 `0 1px 2px rgba(0,0,0,0.06)`

---

## 8. 开发顺序（建议给 Claude Code 的执行计划）

请按顺序完成，每完成一步先跑通再继续：

1. **项目脚手架** —— Vite + TS + Tailwind + Router 跑起来，空白页能切路由
2. **GSAP 与转场** —— `CurveTransition` 单独 demo 页能跑通
3. **数据层** —— IndexedDB schema、recipeStore、seed 内置菜谱
4. **首页** —— "今天吃什么"按钮 + 抽奖动效（先不接推荐算法，随机即可）
5. **菜谱列表 + 详情** —— 能浏览内置菜谱、看 Markdown 渲染
6. **菜谱编辑器** —— 新建/编辑 + Markdown 实时预览
7. **导入页** —— 表单 + 跳转到编辑器
8. **版本树** —— SVG 树可视化 + 创建分支
9. **食材表交互** —— 用量编辑 + 比例滑块 + 另存为新版本
10. **推荐算法** —— `lib/recommender.ts` 接入首页
11. **周计划** —— 网格 + GSAP Draggable + 跨容器拖拽
12. **分享导图** —— `html2canvas` 截图下载
13. **打磨** —— 转场过渡、空状态插画、微交互、移动端适配

每完成一步在 `CHANGELOG.md` 记一行。

---

## 9. 不在 v1 范围内（明确排除）

避免范围蔓延，以下功能 **v1 不做**：

- ❌ 用户账号、登录、云同步
- ❌ 后端 API、数据库服务器
- ❌ 自动从 URL 抓取菜谱内容（CORS、反爬复杂）
- ❌ 视频教程、AI 生成图片
- ❌ 营养计算、卡路里
- ❌ 购物清单、智能采购
- ❌ 多人协作、评论、社区
- ❌ 移动端 App（v1 只做响应式 Web，但桌面优先）

把这些列在 README 的 "Roadmap" 章节，作为 v2+ 设想。

---

## 10. 验收清单

v1 交付前，下列每条都应通过：

- [ ] `npm run dev` 一键启动，无控制台报错
- [ ] 首次启动自动写入 8+ 内置菜谱
- [ ] 能新建、编辑、删除菜谱
- [ ] Markdown 编辑器支持表格、图片、勾选框
- [ ] 导入页能填 URL/备注并跳到编辑器
- [ ] 菜谱详情页能看到版本树（至少两层分支可视化正确）
- [ ] 食材表能修改用量并另存为新版本
- [ ] 首页"今天吃什么"按钮能抽出菜谱，有翻牌动效
- [ ] 周计划页能从抽屉拖菜谱到格子
- [ ] 已填格子能与另一格子拖拽交换
- [ ] 跨页面切换有曲面波浪转场（参考 EaKpEpJ）
- [ ] 拖拽手感符合 GSAP Draggable + 惯性（参考 azmKBBJ）
- [ ] 数据存 IndexedDB，刷新后保留
- [ ] 桌面端（1440px）和平板（768px）布局合理

---

## 11. 给 Claude Code 的工作约定

- 每个文件顶部写 1-2 行注释说明用途
- 类型定义放 `src/types/`，组件不就地定义
- 拒绝 `any`，必要时用 `unknown` + 类型守卫
- 提交前跑 `tsc --noEmit` 确保类型干净
- 任何"我猜用户想要…"的判断 → 停下来问我
- 视觉相关问题先查阅 frontend-design skill，不要自由发挥
- 动画相关 **必须** 用 GSAP，不要引入 Framer Motion 等其他库
- 如发现 CodePen 源码与本文档描述冲突，以 CodePen 源码的**视觉效果**为准、本文档的**功能行为**为准，遇到无法调和处主动询问

---

**文档版本**：v1.0
**最后更新**：2026-05-16
**作者**：（你的名字）

祝开发顺利。让做菜重新变得有趣。
