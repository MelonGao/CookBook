# 更新日志

本文件按规划文档 §8 的开发顺序记录构建进度。

## v1.0 — 初始交付

- 项目脚手架：Vite + React 18 + TypeScript + Tailwind + React Router 跑通
- GSAP 接入与曲面波浪转场：`CurveTransition` 自底部上扫覆盖全屏并退出
- 数据层：IndexedDB schema、`recipeStore` / `planStore`、10 个内置菜谱种子
- 首页：「今天吃什么」抽签卡，单击抽一道 / 长按抽一桌，GSAP 翻牌动效
- 菜谱列表 + 详情：搜索、tag 筛选、Markdown 渲染（react-markdown + remark-gfm）
- 菜谱编辑器：Markdown 实时预览（@uiw/react-md-editor）、封面拖拽上传、结构化食材
- 导入页：来源表单（URL / 备注 / 作者），提交后跳转编辑器
- 版本树：SVG 连线（主干粗线 / 分支细线 / 选中发光），右键 / 长按菜单
- 食材表交互：用量编辑、按比例缩放滑块、另存为新版本（创建子分支）
- 推荐算法 `lib/recommender.ts`：近 7 天降权 + cookCount 加权 + 20% 新鲜抽取
- 周计划：7×3 网格 + GSAP Draggable 惯性拖拽，抽屉拖入 / 格子互换 / 一键生成
- 分享：html2canvas 把菜谱卡片导出为 PNG 下载
- 打磨：曲面转场、空状态、微交互、桌面与平板响应式布局
- 修复：StrictMode 下重复植入种子的问题；切换版本时食材表状态重置
