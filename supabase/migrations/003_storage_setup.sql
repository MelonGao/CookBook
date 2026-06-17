-- 配置图片存储：创建 recipe-covers bucket（公开）+ 行级安全策略
--
-- 封面图和正文内嵌图片都上传到这个 bucket，路径形如 {userId}/{uuid}.jpg。
-- 上传后用公开 URL 引用，所以 bucket 必须是 public。
-- 在 Supabase 控制台 SQL Editor 里运行本文件即可。

-- 1) 创建 bucket（public = true 让公开 URL 可直接访问）
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-covers', 'recipe-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2) 行级安全策略（storage.objects 默认已启用 RLS）

-- 任何人都能读取（公开图片）
DROP POLICY IF EXISTS "recipe covers are publicly readable" ON storage.objects;
CREATE POLICY "recipe covers are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-covers');

-- 登录用户只能上传到以自己 user id 命名的文件夹
DROP POLICY IF EXISTS "users can upload own images" ON storage.objects;
CREATE POLICY "users can upload own images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 登录用户只能更新自己的图片
DROP POLICY IF EXISTS "users can update own images" ON storage.objects;
CREATE POLICY "users can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 登录用户只能删除自己的图片
DROP POLICY IF EXISTS "users can delete own images" ON storage.objects;
CREATE POLICY "users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
