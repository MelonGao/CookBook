-- 匠味 CookbookApp v1.1 初始数据库迁移
-- 包含：表结构、RLS 策略、触发器

-- ========== 用户档案 ==========
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
  cover_url TEXT,
  tags TEXT[] DEFAULT '{}',
  source_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (source_type IN ('builtin', 'custom', 'imported')),
  source_url TEXT,
  source_note TEXT,
  source_author TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  root_version_id UUID,
  cook_count INTEGER DEFAULT 0,
  last_cooked_at TIMESTAMPTZ,
  visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public', 'unlisted')),
  share_slug TEXT UNIQUE,
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
  ingredients JSONB DEFAULT '[]',
  change_note TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_versions_recipe ON versions(recipe_id);
CREATE INDEX idx_versions_parent ON versions(parent_version_id);

-- 补上 recipes.root_version_id 的 FK
ALTER TABLE recipes
  ADD CONSTRAINT fk_root_version
  FOREIGN KEY (root_version_id) REFERENCES versions(id) ON DELETE SET NULL;

-- ========== 周计划表 ==========
CREATE TABLE week_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  slots JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, week_start)
);

CREATE INDEX idx_week_plans_owner ON week_plans(owner_id);

-- ========== 行级安全策略（RLS）==========

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "anyone can view public recipes"
  ON recipes FOR SELECT
  USING (visibility = 'public');

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

-- versions
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

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

-- week_plans
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can fully manage own plans"
  ON week_plans FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ========== Storage 桶的 RLS（在 Supabase 控制台创建 bucket 后运行）==========
-- 注意：这些策略需要在 Supabase 控制台 SQL Editor 中单独运行
-- 或者确认 storage 扩展已启用后在此迁移中运行

-- 任何人能看（公开 bucket）
-- CREATE POLICY "covers are publicly accessible"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'recipe-covers');
--
-- -- 登录用户能上传到自己的文件夹
-- CREATE POLICY "users can upload own covers"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'recipe-covers'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "users can update own covers"
--   ON storage.objects FOR UPDATE
--   TO authenticated
--   USING (
--     bucket_id = 'recipe-covers'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- CREATE POLICY "users can delete own covers"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'recipe-covers'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ========== 触发器 ==========

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
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

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS week_plans_updated_at ON week_plans;
CREATE TRIGGER week_plans_updated_at BEFORE UPDATE ON week_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
