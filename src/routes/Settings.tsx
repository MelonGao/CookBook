// 账号设置：修改档案、导出数据、注销账号
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { updateProfile } from '@/lib/api/profiles';
import { exportUserData } from '@/lib/exportData';
import Button from '@/components/ui/Button';

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [displayName, setDisplayName] = useState((profile?.display_name as string) ?? '');
  const [bio, setBio] = useState((profile?.bio as string) ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(user.id, {
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    await exportUserData(user.id, user.email!);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return;
    // v1: 调用 Supabase Edge Function 或直接提示用户联系管理员
    // 前端 anon key 无权删除 auth.users，这里做二次确认后提示
    alert('账号删除需要服务端操作。v1 版本请联系 cookbook@lizhi.moe 处理。\n\n我们会尽快为你删除全部数据。');
    setDeleteConfirm('');
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 font-hand text-meta text-pencil/60 hover:text-accent hover:line-through"
      >
        <ArrowLeft size={15} strokeWidth={2.5} />
        返回首页
      </button>

      <h1 className="font-title text-h1 text-pencil">账号设置</h1>

      {/* 档案 */}
      <div className="rounded-wobbly border-2 border-pencil bg-white p-6 shadow-hand space-y-4">
        <h2 className="font-title text-h3 text-pencil flex items-center gap-2">
          <User size={20} strokeWidth={2.5} />
          个人档案
        </h2>

        <div>
          <span className="mb-1 block font-hand text-meta text-pencil/60">邮箱（不可修改）</span>
          <p className="font-hand text-body text-pencil">{user.email}</p>
        </div>

        <label className="block">
          <span className="mb-1 block font-hand text-body text-pencil">显示名称</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="你的昵称"
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-hand text-body text-pencil">个人简介</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="写点什么介绍自己…"
            rows={3}
            className="input resize-none"
          />
        </label>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saved ? '已保存' : saving ? '保存中…' : '保存修改'}
          </Button>
        </div>
      </div>

      {/* 数据导出 */}
      <div className="rounded-wobbly border-2 border-pencil bg-white p-6 shadow-hand space-y-3">
        <h2 className="font-title text-h3 text-pencil flex items-center gap-2">
          <Download size={20} strokeWidth={2.5} />
          数据导出
        </h2>
        <p className="font-hand text-body text-pencil/60">
          下载你的全部数据（菜谱、版本、周计划）为 JSON 文件。随时可以带走。
        </p>
        <Button variant="outline" onClick={handleExport}>
          <Download size={14} strokeWidth={2.5} />
          导出我的全部数据
        </Button>
      </div>

      {/* 注销账号 */}
      <div className="rounded-wobbly border-2 border-pencil bg-white p-6 shadow-hand space-y-3">
        <h2 className="font-title text-h3 text-accent flex items-center gap-2">
          <Trash2 size={20} strokeWidth={2.5} />
          危险区域
        </h2>
        <p className="font-hand text-body text-pencil/60">
          删除账号将永久清除你的所有数据（菜谱、版本、周计划），不可恢复。
        </p>
        <div className="flex gap-2">
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="输入 DELETE 确认"
            className="input w-48 text-accent placeholder:text-pencil/30"
          />
          <Button
            className="bg-accent text-white hover:bg-accent"
            disabled={deleteConfirm !== 'DELETE'}
            onClick={handleDelete}
          >
            删除我的账号
          </Button>
        </div>
      </div>
    </div>
  );
}
