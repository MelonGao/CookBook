-- 修复注册时报错 "Database error saving new user"
--
-- 原因：001 里的 handle_new_user() 是 SECURITY DEFINER 函数，但没有固定 search_path，
-- 也没有给表名加 schema 前缀。触发器由 supabase_auth_admin 角色触发时，其 search_path
-- 不包含 public，导致 `INSERT INTO profiles` 找不到表而抛错，进而回滚整个新用户插入。
--
-- 修复点：
--   1. SET search_path = ''  —— 关闭隐式 schema 查找，所有对象必须显式限定。
--   2. public.profiles      —— 显式写明 schema。
--   3. ON CONFLICT DO NOTHING + EXCEPTION 兜底 —— 即使 profile 创建出问题也不阻断注册。

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- 不让 profile 创建失败阻断用户注册；把错误降级为警告记录到日志
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 重新挂载触发器（确保指向更新后的函数）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
