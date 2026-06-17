// 路由根节点 + 全局曲面波浪转场容器 + AuthProvider
// 公开路由（登录、落地页等）跳过转场动画，直接渲染，避免移动端首屏不显示的问题。
import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/auth/AuthGuard';
import CurveTransition from '@/components/transition/CurveTransition';
import { useAuthStore } from '@/stores/authStore';
import { useRecipeStore } from '@/stores/recipeStore';
import Home from '@/routes/Home';
import Landing from '@/routes/Landing';
import Login from '@/routes/Login';
import AuthCallback from '@/routes/AuthCallback';
import RecipeList from '@/routes/RecipeList';
import RecipeDetail from '@/routes/RecipeDetail';
import RecipeEditor from '@/routes/RecipeEditor';
import VersionEditor from '@/routes/VersionEditor';
import WeekPlanner from '@/routes/WeekPlanner';
import Import from '@/routes/Import';
import Settings from '@/routes/Settings';
import Privacy from '@/routes/Privacy';
import Terms from '@/routes/Terms';
import NotFound from '@/routes/NotFound';

const PUBLIC_PATHS = new Set([
  '/login',
  '/landing',
  '/privacy',
  '/terms',
  '/auth/callback',
]);

function isPublicPath(p: string) {
  return PUBLIC_PATHS.has(p) || p.startsWith('/auth/');
}

export default function App() {
  const location = useLocation();
  // 实际渲染用的路由：protected 页面在转场动画"盖满屏幕的那一帧"才切到新路由
  const [displayLocation, setDisplayLocation] = useState(location);
  const authInit = useAuthStore((s) => s.init);
  const authLoading = useAuthStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const recipeInit = useRecipeStore((s) => s.init);

  const targetIsPublic = isPublicPath(location.pathname);

  // 启动时初始化认证
  useEffect(() => {
    void authInit();
  }, [authInit]);

  // 登录后初始化菜谱数据
  useEffect(() => {
    if (user) void recipeInit(user.id);
  }, [user, recipeInit]);

  // 路由切换后回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [displayLocation.pathname]);

  // 公开路由：立即切换，不等动画
  useEffect(() => {
    if (targetIsPublic) {
      setDisplayLocation(location);
    }
  }, [location, targetIsPublic]);

  // 兜底：protected 页面若动画未在 1.5s 内完成，强制切页
  useEffect(() => {
    if (displayLocation.pathname === location.pathname) return;
    if (targetIsPublic) return;
    const t = window.setTimeout(() => setDisplayLocation(location), 1500);
    return () => window.clearTimeout(t);
  }, [location, displayLocation, targetIsPublic]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-hand text-body text-pencil/60">载入中…</p>
      </div>
    );
  }

  return (
    <>
      <Layout>
        <Routes location={targetIsPublic ? location : displayLocation}>
          {/* 公开路由 */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          {/* 需要登录的路由 */}
          <Route path="/" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/recipes" element={<AuthGuard><RecipeList /></AuthGuard>} />
          <Route path="/recipes/:id" element={<AuthGuard><RecipeDetail /></AuthGuard>} />
          <Route path="/recipes/:id/edit" element={<AuthGuard><RecipeEditor /></AuthGuard>} />
          <Route path="/recipes/:id/version" element={<AuthGuard><VersionEditor /></AuthGuard>} />
          <Route path="/new" element={<AuthGuard><RecipeEditor /></AuthGuard>} />
          <Route path="/import" element={<AuthGuard><Import /></AuthGuard>} />
          <Route path="/planner" element={<AuthGuard><WeekPlanner /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>

      {/* 公开路由不渲染转场组件，避免移动端首屏卡住 */}
      {!targetIsPublic && (
        <CurveTransition
          pathname={location.pathname}
          onCovered={() => setDisplayLocation(location)}
        />
      )}
    </>
  );
}
