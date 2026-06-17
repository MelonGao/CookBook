# 寻味 · 视觉设计系统（Hand-Drawn Design System）

> 本文件是项目唯一的视觉真相来源（Single Source of Truth）。
> 所有组件、页面、动效在落地前，都应回头核对本文件。
> 与功能规划文档 `COOKBOOK_APP_PLAN.md` 配套使用：本文件只管"长什么样"，不管"做什么"。

---

## 0. 设计哲学

**手绘风（Hand-Drawn）** 庆祝数字世界中真实的不完美和人的痕迹。
它拒绝现代 UI 的临床级精确，转而拥抱有机、俏皮的不规则——
像纸上的草图、墙上的便利贴、餐巾纸上的头脑风暴图。

**情绪意图**：
亲切、有创造力、以人为本、好玩。
让用户感觉自己是"协作者"而不是"消费者"。
特别适合做菜这种"既日常又需要灵感"的场景——
做饭是私人创作，记录应该看起来像一本你自己的草稿本。

---

## 1. 核心原则（八条铁律）

1. **拒绝直线**：所有 border / 容器 / 形状都用**不规则** `border-radius`，永远不要纯 `rounded-md`/`rounded-lg`/`rounded-full`
2. **真实纹理**：用纸张颗粒、点状图案、半透明叠加来模拟物理介质
3. **俏皮旋转**：元素故意微倾斜（`-2deg` 到 `2deg`），打破刻板网格
4. **硬偏移阴影**：**完全禁止 blur 阴影**。只用纯色偏移阴影（`4px 4px 0px`），制造剪纸/拼贴感
5. **手写字体**：标题用 Kalam，英文正文用 Patrick Hand，中文用霞鹜文楷
6. **涂鸦装饰**：虚线、手绘箭头、胶带、图钉、不规则形状，是设计的一部分
7. **克制配色**：只用六种颜色，不要自创色板
8. **故意"不完美"**：拥抱重叠、错位、视觉"小失误"——让设计像即兴创作，而不是工业产品

---

## 2. Design Tokens（必须放进 `tailwind.config.js`）

### 2.1 颜色（六色，不增不减）

| 名称 | 角色 | Hex | Tailwind 别名 |
|---|---|---|---|
| Warm Paper | 背景（米纸白） | `#fdfbf7` | `paper` |
| Soft Pencil Black | 主文本（不用纯黑） | `#2d2d2d` | `pencil` |
| Old Paper | 弱化/已擦除 | `#e5e0d8` | `muted` |
| Red Correction Marker | 强调色 | `#ff4d4d` | `accent` |
| Pencil Lead | 边框（同主文本） | `#2d2d2d` | `border-pencil` |
| Blue Ballpoint Pen | 次要强调 | `#2d5da1` | `ballpoint` |
| Post-it Yellow | 便利贴（特殊场景） | `#fff9c4` | `postit` |

> 注：便利贴黄色是 design system 里"特殊处理"的颜色，**只用在周计划卡片和 feature card**，其他地方不要乱用。

### 2.2 字体（三栈，明确分工）

| 用途 | 字体 | 权重 | 备注 |
|---|---|---|---|
| 英文标题 | `Kalam` | 700 | 像粗马克笔 |
| 英文正文 | `Patrick Hand` | 400 | 清晰但明显手写 |
| 中文（标题 + 正文） | `LXGW WenKai`（霞鹜文楷） | 400 / 700 | 开源、有手写感、与 Patrick Hand 视觉协调 |

CSS font-family 写法：
```css
/* 标题 */
font-family: 'Kalam', 'LXGW WenKai', cursive;

/* 正文 */
font-family: 'Patrick Hand', 'LXGW WenKai', cursive;
```

中文优先级放在后，是因为：英文字符落到 Kalam/Patrick Hand 上更地道，中文 fallback 到霞鹜文楷不会破坏风格。

#### 字体引入方式
`index.html` `<head>` 加：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=Patrick+Hand&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" rel="stylesheet">
```

#### 字号刻度（大、易读、刻意夸张对比）
| Token | 桌面 | 移动 | 用途 |
|---|---|---|---|
| `text-display` | 64px | 48px | 首页大标题 |
| `text-h1` | 48px | 36px | 页面标题 |
| `text-h2` | 32px | 28px | 区块标题 |
| `text-h3` | 24px | 20px | 卡片标题 |
| `text-body` | 18px | 16px | 正文 |
| `text-meta` | 14px | 13px | 元信息 |

### 2.3 圆角（wobbly 预设，必须配置在 `tailwind.config.js`）

```js
// tailwind.config.js
borderRadius: {
  'wobbly':    '255px 15px 225px 15px / 15px 225px 15px 255px',  // 大容器
  'wobbly-md': '30px 5px 25px 5px / 5px 25px 5px 30px',           // 中卡片、按钮
  'wobbly-sm': '12px 3px 10px 3px / 3px 10px 3px 12px',           // 小元素、tag、input
  'wobbly-blob': '63% 37% 54% 46% / 55% 48% 52% 45%',             // 头像、stats 圆球（替代 rounded-full）
}
```

用法：`className="rounded-wobbly-md"`，禁止任何场景使用 `rounded-md`/`rounded-lg`/`rounded-full`。

**例外**：如果某个组件的 wobbly 默认形状不合适，可以在元素上写内联 `style={{ borderRadius: '...' }}` 用别的不规则值，但**绝不允许** fall back 到标准圆角。

### 2.4 边框

| 场景 | 写法 |
|---|---|
| 默认 | `border-2 border-pencil` |
| 强调 | `border-[3px]` 或 `border-4` |
| 次要/分隔 | `border-2 border-dashed border-pencil` |
| 输入框 focus | `border-ballpoint ring-2 ring-ballpoint/20` |

### 2.5 阴影（铁律：零 blur）

```js
// tailwind.config.js
boxShadow: {
  'hand':       '4px 4px 0px 0px #2d2d2d',
  'hand-lg':    '8px 8px 0px 0px #2d2d2d',
  'hand-sm':    '2px 2px 0px 0px #2d2d2d',
  'hand-hover': '2px 2px 0px 0px #2d2d2d',
  'hand-lift':  '12px 12px 0px 0px #2d2d2d',   // 拖起的便利贴
  'paper':      '3px 3px 0px 0px rgba(45, 45, 45, 0.1)',  // 卡片低对比
}
```

**绝对禁止**：`shadow-md`、`shadow-lg`、`shadow-xl`、`shadow-2xl`、`drop-shadow-*`。
**绝对禁止**：任何带 blur 半径的阴影（即 box-shadow 第三个数值非 0）。

### 2.6 背景纹理

`globals.css` 给 `body` 加点状纸张纹理：
```css
body {
  background-color: #fdfbf7;
  background-image: radial-gradient(#e5e0d8 1px, transparent 1px);
  background-size: 24px 24px;
  color: #2d2d2d;
}
```

---

## 3. 组件样式规范

### 3.1 按钮（Button）

#### Normal
- 背景：白色 `#ffffff`
- 边框：`border-[3px] border-pencil`
- 文字：`text-pencil`，字体 Patrick Hand
- 圆角：`rounded-wobbly-md`
- 阴影：`shadow-hand`
- Padding：`px-6 py-3`（桌面），`px-5 py-2.5`（移动）

#### Hover
- 背景填充 `bg-accent`，文字变白
- 阴影减弱 `shadow-hand-hover`
- 微位移 `translate-x-[2px] translate-y-[2px]`
- 加 `transition-transform duration-100`

#### Active（按下）
- 阴影完全消失（按扁）
- 位移变大 `translate-x-[4px] translate-y-[4px]`

#### Secondary 变体
- 背景 `bg-muted`
- Hover 时填充 `bg-ballpoint`，文字变白

#### 最小可点击区域
高度至少 `h-12`（48px），保证触屏可点。

### 3.2 卡片（Card）

#### 基础
- 背景：`bg-white`
- 边框：`border-2 border-pencil`
- 圆角：`rounded-wobbly-md`
- 阴影：`shadow-paper` 或 `shadow-hand`（强调时）
- 默认略微倾斜：`-rotate-1` 或 `rotate-1`（随机/交替）

#### 装饰变体（通过 prop 控制，例如 `decoration="tape"`）

**胶带（tape）**
- 半透明灰色横条 `bg-pencil/15`
- 定位：`absolute top-[-12px] left-1/2 -translate-x-1/2`
- 尺寸：`w-20 h-6`
- 微旋转：`-rotate-3`

**图钉（tack）**
- 红色圆点 `bg-accent`
- 圆形（用 `rounded-wobbly-blob`）
- 尺寸：`w-5 h-5`
- 定位：`absolute top-[-10px] left-1/2 -translate-x-1/2`
- 自带 `shadow-hand-sm`

**便利贴（postit）**
- 背景换成 `bg-postit`
- 用于 feature card、周计划卡片

#### Hover 行为
- `hover:rotate-1`（如果原本是 `-rotate-1`）或 `hover:-rotate-1`
- `hover:shadow-hand-lg`
- `transition-transform duration-100`

### 3.3 输入框（Input / Textarea）

- 完整边框框（不要只下划线）
- `border-2 border-pencil rounded-wobbly-sm`
- 背景白色，padding `px-4 py-3`
- 字体 Patrick Hand
- placeholder 颜色 `text-pencil/40`
- Focus：
  - 边框 → `border-ballpoint`
  - 加 `ring-2 ring-ballpoint/20`
  - 移除默认 outline：`focus:outline-none`

### 3.4 标签 / Tag（菜谱 tag、tag chip）

- 小号便利贴感
- `bg-postit border-2 border-pencil rounded-wobbly-sm`
- 微旋转（每个 tag 随机 -2deg ~ 2deg）
- 字号 `text-meta`，padding `px-3 py-1`
- 可堆叠时用 `-space-x-2` 制造重叠感

### 3.5 Modal / Dialog

- 遮罩：`bg-pencil/50`（半透明深灰，不要纯黑）
- Modal 框：`bg-white rounded-wobbly border-[3px] border-pencil shadow-hand-lg`
- 关闭按钮：右上角红色圆形（图钉风格），手绘 ×

### 3.6 Markdown 渲染区域

菜谱正文渲染时：
- `h1` → Kalam 700，48px，下方加手绘 SVG 波浪线
- `h2` → Kalam 700，32px
- 列表（食材、步骤）→ 自定义 bullet：用 `▢`（步骤）和 `◯`（食材）替代标准点
- 表格 → 边框 dashed，单元格 padding 充足
- 代码块 → `bg-muted` + `border-2 border-dashed border-pencil`，作为"注释纸条"

---

## 4. 装饰元素清单（点缀，不要滥用）

| 元素 | 使用场景 | 实现方式 |
|---|---|---|
| 手绘箭头（dashed path） | 引导按钮、空状态 | 自绘 SVG，`stroke-dasharray` 制造手绘断续感 |
| 波浪连接线 | 步骤之间、流程之间 | SVG `<path>` 加 `Q` 二次贝塞尔 |
| 胶带 | 卡片顶部装饰 | 见 3.2 |
| 图钉 | 卡片角标 | 见 3.2 |
| 虚线圆 | 高亮某个选项 | `border-2 border-dashed`，旋转 + 比卡片大一圈 |
| 涂改线（删除线 hover） | 链接 hover | `hover:line-through` |
| 弹跳装饰圈 | 首页主图旁、CTA 旁 | `animate-bounce`（自定义 3s 缓慢版） |
| 角落框记 | 首页主图四角 | SVG 短直角线 |

**桌面专属**（手机不显示，避免拥挤）：
- 手绘箭头、装饰弹跳圈、虚线圆 → 加 `hidden md:block`

---

## 5. 布局策略

- 最大宽度：`max-w-5xl mx-auto`（像一本草稿本，不要做满屏）
- 区块垂直节奏：`py-20`（桌面），`py-12`（移动）
- 网格 gap：`gap-8`（避免拥挤）
- 卡片在网格里：每张卡的 `rotate` 微调（用 `:nth-child` 或随机），交替正负，制造手贴墙感
- 重要内容放大：highlighted 元素 `md:scale-105`
- 重叠层次：头像群 `-space-x-4`，装饰元素 `absolute` 突出父框

---

## 6. 动效规范

| 场景 | 效果 | 实现 |
|---|---|---|
| 按钮 hover | translate + 阴影缩小 | Tailwind transition |
| 卡片 hover | 旋转 + 阴影变大 | `hover:rotate-1 hover:shadow-hand-lg` |
| 装饰元素 | 缓慢弹跳 | `animate-bounce` 自定义 3s duration |
| 页面转场 | 曲面波浪覆盖 | **GSAP**（见 `COOKBOOK_APP_PLAN.md` §5），颜色改为 `#fdfbf7` → `#ff4d4d` |
| 拖拽便利贴 | 拖起阴影变远 `shadow-hand-lift`，落下回弹 | **GSAP Draggable**（见 `COOKBOOK_APP_PLAN.md` §6） |
| 链接 hover | 涂改线 | `hover:line-through decoration-2 decoration-accent` |
| 抽奖翻牌（今天吃什么） | 卡片翻转 + 微旋转着陆 | GSAP timeline，落地角度随机 -3deg ~ 3deg |

**绝对禁止**：
- ❌ 引入 Framer Motion / Motion One / React Spring
- ❌ blur 类动画（fade-blur、backdrop-blur）
- ❌ 缓动函数用线性（`linear`），全部用 `power2.out` / `back.out` 体现弹性

---

## 7. 图标

- 库：`lucide-react`（已在 `COOKBOOK_APP_PLAN.md` 选定）
- `strokeWidth={2.5}` 或 `3`（不要默认 2）
- 关键图标外面套手绘圆圈：用 SVG `circle` + `stroke-dasharray` 模拟手绘

例：
```tsx
<div className="relative inline-block">
  <svg className="absolute inset-0" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="none"
            stroke="#2d2d2d" strokeWidth="2"
            strokeDasharray="3 2" />
  </svg>
  <Heart className="w-6 h-6" strokeWidth={3} />
</div>
```

---

## 8. 响应式策略

### 移动优先
- 字号、间距、padding 都按"先移动、再桌面"写
- 桌面断点用 `md:`（768px）和 `lg:`（1024px）

### 移动端简化
| 元素 | 移动 | 桌面 |
|---|---|---|
| 装饰箭头/弹跳圈 | `hidden` | `md:block` |
| 旋转角度 | `-rotate-1` | `md:-rotate-2` |
| 网格列数 | 1 列 | `md:grid-cols-2` 或 `3` |
| 字号 | `text-h2` 移动版 | `md:text-h2` 桌面版 |

### 保留核心美学
即使在最小屏幕：
- wobbly border 不变
- 手写字体不变
- hard offset shadow 不变（但 offset 可以从 4px 缩到 3px）

---

## 9. 周计划页特别说明（招牌时刻）

这是整个 app 的视觉高光：**一张便利贴板**。

- 7×3 网格，每个 slot 是一张便利贴
- 便利贴样式：
  - `bg-postit border-2 border-pencil rounded-wobbly-sm shadow-hand`
  - 每张随机 `rotate(-2deg ~ 2deg)`（用 inline style + `Math.random()`，但要稳定——基于 slot.id 做 hash，避免每次 render 都变）
  - 空 slot：dashed border、半透明、placeholder 文字 "（拖一张菜过来）"
- 拖起时：
  - GSAP `to(el, { rotation: 0, scale: 1.08, boxShadow: '12px 12px 0px 0px #2d2d2d', duration: 0.2 })`
- 落下时：
  - `back.out(1.5)` 缓动，恢复随机旋转
- 左侧菜谱抽屉：菜谱卡片是白色普通卡片（不是便利贴），拖出时变成便利贴风格再落到格子里

---

## 10. 不要做（反例清单）

| 做错的 | 应该这样 |
|---|---|
| `rounded-md` / `rounded-full` | `rounded-wobbly-*` |
| `shadow-md` / `shadow-lg` | `shadow-hand` / `shadow-hand-lg` |
| 纯黑 `#000000` | `#2d2d2d`（pencil） |
| 思源黑体 / Inter 作主字体 | Kalam / Patrick Hand / 霞鹜文楷 |
| 渐变色背景（除转场动画外） | 纯色 + 纹理 |
| 完美对齐的网格 | 加 `rotate-1` / `-rotate-1` 打破 |
| Framer Motion 做动画 | GSAP 统一 |
| 圆形头像 `rounded-full` | `rounded-wobbly-blob` |
| 商业感配色（红黄外卖风） | 米纸白 + 焦糖橙 + 蓝圆珠笔，克制 |
| 玻璃拟态 / 毛玻璃 | 纸张纹理 + 硬阴影 |

---

## 11. 与 `COOKBOOK_APP_PLAN.md` 的关系

- 本文件 = **视觉真相**：长什么样、用什么色、什么字、什么动效
- `COOKBOOK_APP_PLAN.md` = **功能真相**：做什么、数据怎么存、路由怎么走、GSAP 转场和拖拽的逻辑

**冲突解决规则**：
- 视觉冲突 → 以**本文件**为准（例如 PLAN §7.3 原本写了"日式衬线 + Source Han Serif"，已作废，按本文件 §2.2 执行）
- 功能冲突 → 以 **PLAN** 为准
- 都没说清楚 → **停下来问用户**，不要自由发挥

---

**版本**：v1.0
**最后更新**：2026-05-24
**适用项目**：cookbook-app（寻味）
