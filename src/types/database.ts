// Supabase 数据库行类型（snake_case，对应 PostgreSQL 列名）
// 业务层使用 src/types/recipe.ts 的 camelCase 版本

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeRow {
  id: string;
  owner_id: string;
  title: string;
  cover_url: string | null;
  tags: string[];
  source_type: 'builtin' | 'custom' | 'imported';
  source_url: string | null;
  source_note: string | null;
  source_author: string | null;
  body_md: string;
  root_version_id: string | null;
  cook_count: number;
  last_cooked_at: string | null;
  visibility: 'private' | 'public' | 'unlisted';
  share_slug: string | null;
  fork_from_recipe_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VersionRow {
  id: string;
  recipe_id: string;
  parent_version_id: string | null;
  label: string;
  body_md: string;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  change_note: string | null;
  rating: number | null;
  created_at: string;
}

export interface WeekPlanRow {
  id: string;
  owner_id: string;
  week_start: string;
  slots: Array<{
    id: string;
    date: string;
    meal: string;
    recipeId?: string;
    versionId?: string;
    note?: string;
  }>;
  updated_at: string;
}

// Supabase 生成的完整 Database 类型（用于泛型参数）
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      recipes: {
        Row: RecipeRow;
        Insert: Omit<RecipeRow, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<RecipeRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      versions: {
        Row: VersionRow;
        Insert: Omit<VersionRow, 'created_at'>;
        Update: Partial<Omit<VersionRow, 'id' | 'created_at'>>;
      };
      week_plans: {
        Row: WeekPlanRow;
        Insert: Omit<WeekPlanRow, 'updated_at'>;
        Update: Partial<Omit<WeekPlanRow, 'id' | 'updated_at'>>;
      };
    };
  };
}
