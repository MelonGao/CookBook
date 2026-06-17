# 寻味（Cookbook App）—— 项目规划文档 v1.1

> 给 Claude Code 阅读的开发说明书。请按本文档循序构建，遇到歧义优先询问而非自行假设。
> 视觉设计请配合 `DESIGN_SYSTEM.md` 阅读，本文件只管功能，不管视觉。

## 版本说明

- **v1.0 → v1.1 主要变化**：数据层从纯本地 IndexedDB 改为 **Supabase 云端**；新增账号系统、合规清单、数据导出
- **v1.1 当前选型决策**：
  - 用户分布：海外 + 国内都覆盖，采用海外节点 + 不备案策略
  - 封面图：Supabase Storage（CDN）
  - 离线策略：完全在线（v1 不做 PWA）
  - 数据导出 JSON：v1 必做

---

## 0. 项目愿景

做一个让"做菜"变成一件**独具匠心**的事情的 Web App。

**问题**：做饭做多了会觉得麻木。
**解法**：用记录让一切真实可感——每一次复刻、每一次微调都被沉淀下来；同时帮你解决"今天到底吃什么"这件日常小事。

**项目代号**：`cookbook-app`（中文名"匠味"）

---

## 1. 技术栈

请严格使用以下技术栈，不要替换：

### 前端
- **构建工具**：Vite
- **框架**：React 18 + TypeScript
- **路由**：React Router v6
- **状态管理**：Zustand
- **样式**：Tailwind CSS + CSS Modules
- **Markdown 编辑器**：`@uiw/react-md-editor`
- **Markdown 渲染**：`react-markdown` + `remark-gfm`
- **动画**：**GSAP 3**（Draggable + InertiaPlugin）
- **图标**：`lucide-react`
- **图片截图**：`html2canvas`（导出菜谱卡片用）

### 后端 / BaaS
- **数据库 + 认证 + 存储**：**Supabase**
- **Supabase 客户端**：`@supabase/supabase-js`
- **认证 UI**（可选）：`@supabase/auth-ui-react`，但我们用手绘风自己写，**不引入这个**

### 部署
- **静态托管**：Vercel（首选）或 Netlify
- **域名**：海外节点优先，例如 `.app` / `.com`
- **CDN**：Vercel/Netlify 自带，全球可访问
- **不做 ICP 备案**（v1 阶段）

### 安装命令
```bash
npm create vite@latest cookbook-app -- --template react-ts
cd cookbook-app
npm i react-router-dom zustand gsap
npm i @uiw/react-md-editor react-markdown remark-gfm
npm i lucide-react html2canvas
npm i @supabase/supabase-js
npm i -D tailwindcss postcss autoprefixer
```

---

## 2. 目录结构

```
cookbook-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # 路由根 + 转场容器 + AuthProvider
│   ├── routes/
│   │   ├── Landing.tsx               # 未登录的着陆页
│   │   ├── Login.tsx                 # 登录页（magic link + Google）
│   │   ├── AuthCallback.tsx          # OAuth 回调处理
│   │   ├── Home.tsx                  # 首页（登录后）
│   │   ├── RecipeList.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── RecipeEditor.tsx
│   │   ├── VersionEditor.tsx
│   │   ├── WeekPlanner.tsx
│   │   ├── Import.tsx
│   │   ├── Settings.tsx              # ★ 新增：账号设置 + 数据导出 + 注销
│   │   └── Privacy.tsx               # ★ 新增：隐私政策（必备合规）
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthGuard.tsx         # 路由保护
│   │   │   └── UserMenu.tsx          # 右上角头像菜单
│   │   ├── transition/
│   │   ├── draggable/
│   │   ├── recipe/
│   │   └── ui/
│   ├── stores/
│   │   ├── authStore.ts              # ★ 新增：当前用户、登录状态
│   │   ├── recipeStore.ts
│   │   └── planStore.ts
│   ├── lib/
│   │   ├── supabase.ts               # ★ Supabase 客户端单例
│   │   ├── api/                      # ★ 数据访问层（包一层，便于将来换底）
│   │   │   ├── recipes.ts
│   │   │   ├── versions.ts
│   │   │   ├── plans.ts
│   │   │   ├── storage.ts
│   │   │   └── auth.ts
│   │   ├── gsapSetup.ts
│   │   ├── recommender.ts
│   │   └── exportData.ts             # ★ 新增：JSON 导出
│   ├── types/
│   │   ├── recipe.ts
│   │   └── database.ts               # ★ Supabase 自动生成的类型
│   └── styles/
├── public/
│   └── seed-recipes/                 # 内置菜谱 Markdown 文件
├── supabase/
│   ├── migrations/                   # ★ SQL 迁移脚本
│   │   └── 001_initial_schema.sql
│   └── seed.sql                      # ★ 内置菜谱种子 SQL
├── .env.local                        # ★ Supabase URL 和 anon key
├── .env.example                      # ★ 提交到 git，示例配置
└── package.json
```

---

## 3. 数据库设计（Supabase / PostgreSQL）

> ★ 核心改动：所有数据存 Supabase，不再用 IndexedDB。
> 字段命名采用 PostgreSQL 惯例 `snake_case`，TypeScript 类型层做转换为 `camelCase`。

### 3.1 表 schema（写在 `supabase/migrations/001_initial_schema.sql`）

```sql
-- ========== 用户档案 ==========
-- Supabase Auth 自带 auth.users，我们补一张 profile 关联业务字段
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 菜谱主表 ==========
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_url TEXT,                            -- Supabase Storage 的公开 URL
  tags TEXT[] DEFAULT '{}',
  source_type TEXT NOT NULL DEFAULT 'custom' -- 'builtin' | 'custom' | 'imported'
    CHECK (source_type IN ('builtin', 'custom', 'imported')),
  source_url TEXT,
  source_note TEXT,
  source_author TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  root_version_id UUID,                      -- FK 在 versions 建好后加
  cook_count INTEGER DEFAULT 0,
  last_cooked_at TIMESTAMPTZ,
  -- ★ 为 v2 社区预留的字段，v1 不使用，但表里就建好
  visibility TEXT NOT NULL DEFAULT 'private' -- 'private' | 'public' | 'unlisted'
    CHECK (visibility IN ('private', 'public', 'unlisted')),
  share_slug TEXT UNIQUE,                    -- 公开链接短码，v2 用
  fork_from_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_owner ON recipes(owner_id);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_visibility ON recipes(visibility) WHERE visibility != 'private';

-- ========== 版本表（迭代树）==========
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  body_md TEXT NOT NULL DEFAULT '',
  ingredients JSONB DEFAULT '[]',            -- [{name, amount, unit}]
  change_note TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_versions_recipe ON versions(recipe_id);
CREATE INDEX idx_versions_parent ON versions(parent_version_id);

-- 现在补上 recipes.root_version_id 的 FK
ALTER TABLE recipes
  ADD CONSTRAINT fk_root_version
  FOREIGN KEY (root_version_id) REFERENCES versions(id) ON DELETE SET NULL;

-- ========== 周计划表 ==========
CREATE TABLE week_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  slots JSONB DEFAULT '[]',                  -- [{id, date, meal, recipeId, versionId, note}]
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, week_start)
);

CREATE INDEX idx_week_plans_owner ON week_plans(owner_id);
```

### 3.2 行级安全策略（RLS）—— 这是数据安全的核心

**绝对不要省略**。每张表都必须开 RLS 并写策略，否则前端拿到 anon key 的人可以读任何数据。

```sql
-- ========== profiles ==========
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 任何登录用户能读所有 profile（v2 社区需要看别人主页）
CREATE POLICY "profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 只能改自己的
CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ========== recipes ==========
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 自己能看自己的全部 + 公开/未列出的（为 v2 留口）
CREATE POLICY "users can view own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "anyone can view public recipes"
  ON recipes FOR SELECT
  USING (visibility = 'public');

-- 增删改只能针对自己的
CREATE POLICY "users can insert own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ========== versions ==========
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- versions 跟随其 recipe 的可见性
CREATE POLICY "users can view versions of accessible recipes"
  ON versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = versions.recipe_id
        AND (recipes.owner_id = auth.uid() OR recipes.visibility = 'public')
    )
  );

CREATE POLICY "users can modify versions of own recipes"
  ON versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = versions.recipe_id
        AND recipes.owner_id = auth.uid()
    )
  );

-- ========== week_plans ==========
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;

-- 周计划完全私有
CREATE POLICY "users can fully manage own plans"
  ON week_plans FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

### 3.3 触发器

```sql
-- 注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at 自动更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER week_plans_updated_at BEFORE UPDATE ON week_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3.4 TypeScript 类型生成

用 Supabase CLI 一键从数据库生成类型：

```bash
npx supabase gen types typescript --project-id <your-id> > src/types/database.ts
```

业务层类型 `src/types/recipe.ts` 写"前端用的 camelCase 版本"，加上转换函数。

---

## 4. 认证流程

### 4.1 两种登录方式

**A. Magic Link（邮箱无密码登录）**
- 用户输入邮箱 → 收到含登录链接的邮件 → 点击 → 自动登录
- Supabase 内置，零配置

**B. Google OAuth**
- 用户点击"用 Google 登录" → 跳转 Google → 授权 → 回调到 `/auth/callback`
- 需要在 Supabase 控制台配置 Google OAuth Client ID（去 Google Cloud Console 申请）

### 4.2 登录页 UI

`routes/Login.tsx`：
- 整页设计成"草稿本封面"感（手绘风）
- 上半部分：标题"匠味"+ 标语"让做菜变成手艺"
- 下半部分：
  - 邮箱输入框（手绘风 input）
  - "发送登录链接"按钮
  - 分隔线（虚线 + 中间小字"或"）
  - "用 Google 登录"按钮（带 Google 图标）
- 底部：小字"登录即表示同意" + 链接到《隐私政策》《用户协议》

### 4.3 实现要点

```ts
// lib/api/auth.ts
import { supabase } from '../supabase';

export async function signInWithEmail(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
```

### 4.4 全局监听登录状态

`stores/authStore.ts`（Zustand）：

```ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
}));
```

`App.tsx` 启动时调 `init()`，包一层 loading 状态。

### 4.5 路由保护

`components/auth/AuthGuard.tsx`：未登录访问需要登录的页面 → 自动跳 `/login`。

未登录可访问的路由：`/login`、`/auth/callback`、`/landing`、`/privacy`、`/terms`。
其他全部需要登录。

---

## 5. 封面图存储（Supabase Storage）

### 5.1 创建 bucket

Supabase 控制台手动创建一个 bucket：

- 名称：`recipe-covers`
- Public：**是**（菜谱封面要 CDN 直链）
- File size limit：5 MB
- Allowed MIME types：`image/jpeg`, `image/png`, `image/webp`

### 5.2 Storage 的 RLS

```sql
-- 任何人能看（公开 bucket）
CREATE POLICY "covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-covers');

-- 登录用户能上传到自己的文件夹（路径形如 {user_id}/{filename}）
CREATE POLICY "users can upload own covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 只能改/删自己的
CREATE POLICY "users can update own covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 5.3 上传 API

```ts
// lib/api/storage.ts
export async function uploadCover(file: File, userId: string) {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('recipe-covers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('recipe-covers')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

### 5.4 前端压缩

上传前用 canvas 把图压到最大 1600px 宽、JPEG 80% 质量，再传。可以用 `browser-image-compression` 包，零成本。

---

## 6. 三大核心功能（v1 必交付）

> 功能定义与 v1.0 一致，只是数据层从 IndexedDB 换成 Supabase。

### 6.1 记录（Record）

#### 6.1.1 内置菜谱
- `public/seed-recipes/` 放 8-10 个 Markdown 文件
- 部署 Supabase 项目时跑 `supabase/seed.sql` 把它们写入 `recipes` 表
- 内置菜谱 `owner_id` 设为一个**系统账号**（手动建一个邮箱比如 `system@cookbook.app`，把它的 UUID 写死在 seed 里），`visibility = 'public'`，`source_type = 'builtin'`
- 新用户注册时自动**复制**这些公共菜谱到自己名下（一次性，让用户能自由编辑）

> 实现：profile 创建触发器里再追加一段，把 builtin 菜谱 INSERT INTO ... SELECT ... 给新用户。

#### 6.1.2 自定义新建
- `RecipeEditor.tsx`：左 Markdown 输入、右实时预览
- 封面图：拖拽或选择 → 前端压缩 → `uploadCover` → URL 写入 `recipes.cover_url`
- 提交：`recipes` INSERT + `versions` INSERT（创建主干根版本）+ 更新 `recipes.root_version_id`
- 用 Supabase 事务包起来（用 RPC 或前端确保失败回滚）

#### 6.1.3 从外部导入
- `Import.tsx`：URL / 出处备注 / 作者
- v1 **不抓取**，仅记录元数据
- 跳转到 `RecipeEditor`，预填 `source_url` 等字段

#### 6.1.4 Markdown 支持
- GFM、图片、勾选框
- 编辑器快捷按钮：粗体/斜体/标题/列表/图片

### 6.2 菜谱迭代（Version Tree）

> 与 v1.0 一致，数据层换成 Supabase versions 表。

- 树形可视化 SVG 画连线
- 主干根：`parent_version_id IS NULL`
- 创建分支：INSERT 一行 `versions`，`parent_version_id` 指向当前版本
- 食材表交互、比例滑块、另存为新版本：同 v1.0

### 6.3 规划和分享（Plan & Share）

#### "今天吃什么"
- 算法在前端跑（菜谱量小）
- 翻牌动效用 GSAP

#### 一周菜单规划
- 用 GSAP Draggable + InertiaPlugin（参考 CodePen azmKBBJ 的 dynamic 版本）
- 拖拽落定后调用 `week_plans` upsert
- **便利贴风格**：见 `DESIGN_SYSTEM.md` §9

#### 分享（v1 简化版）
- 详情页"分享"按钮 → `html2canvas` 截图 → 下载 PNG
- **不做**公开链接（留给 v2，但 `share_slug` 字段已经在表里预留）

---

## 7. 页面转场

参考 CodePen EaKpEpJ。颜色已调整为手绘风（详见 `DESIGN_SYSTEM.md` §6）：起色 `#fdfbf7`，终色 `#ff4d4d`。

实现要点：用 SVG path 配合 GSAP timeline 做出"曲面波浪从底部上扫覆盖屏幕 → 中段隆起 → 完全覆盖 → 上方退出"的效果。路由切换在覆盖最盛的一帧执行。

---

## 8. UI 控件（拖拽）

参考 CodePen azmKBBJ，使用 `type: "x,y"` + `inertia: true` 的 dynamic 版本。

详见 `DESIGN_SYSTEM.md` §9（便利贴风格的具体拖拽行为）。

---

## 9. 视觉设计

**强制**：使用 `DESIGN_SYSTEM.md` 中的"手绘风"设计系统。开发前必读。

---

## 10. 数据导出（v1 必做）

### 10.1 用户故事
"我把心血都放进这个 app 了，万一你哪天关站怎么办？"
**答**：用户随时能下载自己的全部数据。

### 10.2 实现

`routes/Settings.tsx` 加一个按钮"导出我的全部数据"。

```ts
// lib/exportData.ts
export async function exportUserData(userId: string) {
  const [recipes, versions, plans, profile] = await Promise.all([
    supabase.from('recipes').select('*').eq('owner_id', userId),
    supabase.from('versions').select('*, recipes!inner(owner_id)')
      .eq('recipes.owner_id', userId),
    supabase.from('week_plans').select('*').eq('owner_id', userId),
    supabase.from('profiles').select('*').eq('id', userId).single(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0',
    profile: profile.data,
    recipes: recipes.data,
    versions: versions.data,
    weekPlans: plans.data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cookbook-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 10.3 导入（v1 可选，v2 必做）
v1 阶段先只做导出。v2 加导入（解析 JSON 还原数据）。

---

## 11. 合规清单（v1 上线必备）

### 11.1 必备页面

- **隐私政策**（`/privacy`）
  - 收集什么数据（邮箱、Google 头像、用户创建的菜谱）
  - 数据存哪里（Supabase，海外服务器）
  - 第三方服务（Google OAuth、Vercel/Netlify CDN）
  - 用户权利：访问、修改、导出、删除
  - 联系方式（邮箱）

- **用户协议**（`/terms`）
  - 服务范围与免责
  - 用户上传内容的版权归用户
  - 禁止行为
  - 终止服务条款

> 模板可以参考 termly.io 免费生成器，再人工改成中英双语。**不要照搬别家的**，关键条款要符合你实际做的事。

### 11.2 必备功能

- **账号注销**：Settings 页"删除我的账号"按钮
  - 调用 Supabase Admin API（需要在 Edge Function 里调，前端没权限）
  - 删除 auth.users → 触发 CASCADE 删除所有数据
  - 二次确认 + 输入"DELETE"确认

- **数据导出**：见 §10

- **数据修改**：Settings 页能改 display_name、avatar、bio

### 11.3 cookie / 追踪

- v1 **不接** Google Analytics、不放第三方追踪
- Supabase 自己的会话 cookie 是必要 cookie，不需要 banner
- 如果接 Plausible / Umami 这种无 cookie 分析也无需 banner

### 11.4 GDPR / 中国个保法关注点

- **数据可携带**：导出 JSON 满足
- **被遗忘权**：账号注销满足
- **明示同意**：登录页底部明示同意条款
- **未成年人**：v1 不主动收集，但条款里写"未满 14 岁须家长同意"

---

## 12. 为 v2 预留的接口

> 这些字段/能力在 v1 不暴露给用户，但表里、代码里要预留好，v2 启动时零迁移。

| 预留项 | 在哪里 | v1 状态 | v2 启用方式 |
|---|---|---|---|
| `visibility` 字段 | recipes 表 | 默认 `'private'`，前端不暴露 | v2 加"公开/私密"开关 |
| `share_slug` 字段 | recipes 表 | NULL | v2 用户点"分享"时生成 |
| `fork_from_recipe_id` 字段 | recipes 表 | NULL | v2 "复刻到我这"功能写入 |
| `username` 字段 | profiles 表 | NULL，v1 不让用户设 | v2 加"设置 username"页 |
| `bio` 字段 | profiles 表 | NULL | v2 个人主页用 |
| RLS 公开读策略 | recipes / versions | 已写好，但因为没 public 数据所以不触发 | v2 用户切换 visibility 即生效 |
| API 抽象层 | `lib/api/` | 已建好 | v2 加新方法 |

**关键纪律**：v1 阶段**绝对不允许**为了"快"而绕开 RLS、不允许直接用 anon key 跨用户读取、不允许把 visibility 字段藏到 UI 但写入 'public'。

---

## 13. 环境变量

`.env.example`：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local`（**不提交到 git**）：填真实值。

`.gitignore` 确保有 `.env.local`。

---

## 14. 开发顺序（建议给 Claude Code 的执行计划）

请严格按顺序，每完成一步先跑通再继续：

1. **Supabase 项目创建**
   - 注册 Supabase → 新建项目（区域选 Singapore 或 Tokyo，国内访问最快）
   - 跑 `001_initial_schema.sql` 建表
   - 控制台配置 Google OAuth Provider
   - 创建 `recipe-covers` Storage bucket 并加 RLS
   - 生成 anon key、project URL，写入 `.env.local`

2. **项目脚手架**
   - Vite + TS + Tailwind + Router
   - Supabase 客户端初始化（`lib/supabase.ts`）
   - 生成 database 类型

3. **认证流程**
   - Login 页（手绘风，含 magic link 和 Google 两个入口）
   - AuthCallback 处理回调
   - authStore + AuthGuard
   - 登录后跳 Home，未登录跳 Landing

4. **API 抽象层**
   - `lib/api/recipes.ts`、`versions.ts`、`plans.ts`、`storage.ts`、`auth.ts`
   - 全部带类型、带错误处理

5. **GSAP 转场**
   - `CurveTransition` 接入 React Router

6. **首页 + 推荐**
   - "今天吃什么"按钮 + 翻牌

7. **菜谱列表 + 详情**

8. **菜谱编辑器 + 封面图上传**

9. **导入页**

10. **版本树 + 食材表交互**

11. **周计划 + 便利贴拖拽**

12. **分享导图（html2canvas）**

13. **Settings 页**
    - 改 profile
    - 数据导出 JSON
    - 注销账号

14. **隐私政策 + 用户协议页**

15. **打磨**：错误状态、空状态、loading、移动端适配

16. **部署**：Vercel + 自定义域名 + Supabase 生产环境

---

## 15. 不在 v1 范围内

- ❌ 菜谱公开分享（公开链接、"复刻到我这"）→ v2
- ❌ 个人主页、关注、Feed → v3
- ❌ 评论、点赞 → v3
- ❌ 离线 PWA → v2
- ❌ 数据导入（导入 JSON 还原） → v2
- ❌ 移动 App → 未定
- ❌ 营养分析、购物清单 → 未定
- ❌ AI 生成菜谱 → 未定

---

## 16. 验收清单

v1 上线前每项必须通过：

- [ ] `npm run dev` 一键启动，无控制台报错
- [ ] 邮箱 magic link 登录跑通（端到端）
- [ ] Google OAuth 登录跑通
- [ ] 注销账号能用，相关数据 CASCADE 删除
- [ ] 新用户自动获得内置菜谱副本
- [ ] 创建/编辑/删除菜谱
- [ ] 上传封面图（含前端压缩）
- [ ] Markdown 编辑器支持表格、图片、勾选框
- [ ] 版本树正确显示，能创建分支
- [ ] 食材表能修改用量并另存为新版本
- [ ] "今天吃什么"按钮和翻牌动效
- [ ] 周计划拖拽（含跨容器、含格子互换）
- [ ] 转场动效（曲面波浪）正确触发
- [ ] 数据导出 JSON 包含完整用户数据
- [ ] RLS 验证：用账号 A 尝试访问账号 B 的数据应失败
- [ ] 隐私政策 + 用户协议页面可访问
- [ ] 桌面 1440px 和移动 375px 布局合理
- [ ] Lighthouse 性能分 >80

---

## 17. 给 Claude Code 的工作约定

- 每个文件顶部 1-2 行注释说明用途
- 类型定义放 `src/types/`
- 拒绝 `any`，必要时用 `unknown` + 类型守卫
- 提交前跑 `tsc --noEmit`
- **数据库操作全部走 `lib/api/`**，组件里**不允许**直接调 `supabase.from()`
- **不允许**为了图快绕开 RLS（不允许用 service role key 跑前端代码）
- 任何"我猜用户想要"的判断 → 停下来问
- 视觉问题查 `DESIGN_SYSTEM.md`
- 动画必须用 GSAP，不要引入 Framer Motion
- CodePen 源码冲突时：视觉以 CodePen 为准，行为以本文件为准

---

**文档版本**：v1.1
**最后更新**：2026-05-24
**配套文件**：`DESIGN_SYSTEM.md`

祝开发顺利。
