// 未登录着陆页 —— 手绘风封面
import { useNavigate } from 'react-router-dom';
import { ChefHat, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="rounded-wobbly border-[3px] border-pencil bg-white p-10 shadow-hand-lg">
        <div className="mx-auto mb-6 rounded-wobbly-blob bg-postit p-4">
          <ChefHat size={64} strokeWidth={2.5} className="text-accent" />
        </div>

        <h1 className="font-title text-h1 text-accent">寻味</h1>
        <p className="mt-2 font-hand text-h4 text-pencil/70">Cookbook</p>

        <p className="mt-6 max-w-md font-hand text-body text-pencil/60">
          让做菜重新变得有趣 —— 一本属于你自己的手写菜谱草稿本。
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button onClick={() => navigate('/login')}>
            <ExternalLink size={16} strokeWidth={2.5} />
            开始使用
          </Button>
          <p className="font-hand text-meta text-pencil/50">
            登录以同步你的菜谱到云端
          </p>
        </div>
      </div>

      <p className="mt-10 font-hand text-meta text-pencil/40">
        <button
          onClick={() => navigate('/privacy')}
          className="underline underline-offset-2 hover:text-accent"
        >
          隐私政策
        </button>
        {' · '}
        <button
          onClick={() => navigate('/terms')}
          className="underline underline-offset-2 hover:text-accent"
        >
          用户协议
        </button>
      </p>
    </div>
  );
}
