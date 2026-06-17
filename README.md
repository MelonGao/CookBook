# 寻味 · Cookbook App

> 让"做菜"重新变成一件独具匠心的事。

做饭做多了会觉得麻木。寻味用记录让一切真实可感——每一次复刻、每一次微调都被沉淀下来；
同时帮你解决"今天到底吃什么"这件日常小事。

## 三大核心功能

1. **记录** —— 内置菜谱、自定义新建、从外部收藏，统一的 Markdown 编辑器。
2. **菜谱迭代** —— 每个菜谱是一棵版本树，任何版本都能再分叉，调一次用量就留一版。
3. **规划与分享** —— 「今天吃什么」抽签、一周菜单拖拽规划、菜谱卡片导出成图。

## 技术栈

- 构建：Vite · React 18 · TypeScript
- 路由：React Router v6 ｜ 状态：Zustand ｜ 持久化：IndexedDB（`idb`）
- 样式：Tailwind CSS ｜ 动画与拖拽：GSAP 3（Draggable + InertiaPlugin）
- Markdown：`@uiw/react-md-editor`（编辑）+ `react-markdown` / `remark-gfm`（渲染）
- 截图分享：`html2canvas` ｜ 图标：`lucide-react`

## 本地运行

```bash
npm install
npm run dev        # 启动开发服务器
npm run build      # 类型检查 + 生产构建
npm run preview    # 预览生产构建
```

首次启动会自动把 10 个内置菜谱写入浏览器 IndexedDB。**所有数据仅保存在本机浏览器，不上传任何服务器。**

## 目录结构

```
src/
├── routes/        页面：首页 / 列表 / 详情 / 编辑器 / 版本编辑 / 周计划 / 导入
├── components/
│   ├── transition/  曲面波浪页面转场
│   ├── draggable/   GSAP Draggable 拖拽卡片
│   ├── recipe/      菜谱卡片 / 版本树 / 食材表 / Markdown 编辑与渲染
│   └── ui/          基础控件（Button / Modal / Tag …）
├── stores/        Zustand：recipeStore / planStore
├── db/            IndexedDB schema 与内置菜谱种子
├── lib/           GSAP 注册 / 推荐算法 / 日期 / 分享等工具
└── types/         全局类型定义
public/seed-recipes/  内置菜谱（含 YAML frontmatter 的 Markdown）
```

## Roadmap（v2+ 设想，v1 不做）

以下功能明确不在 v1 范围，列为后续设想：

- 用户账号、登录、云同步
- 后端 API、数据库服务器
- 自动从 URL 抓取菜谱内容（CORS、反爬复杂）
- 视频教程、AI 生成图片
- 营养计算、卡路里
- 购物清单、智能采购
- 多人协作、评论、社区
- 原生移动端 App（v1 仅做响应式 Web，桌面优先）

---

让做菜重新变得有趣。
