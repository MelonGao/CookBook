// 404 页
import { useNavigate } from 'react-router-dom';
import { Soup } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Soup size={56} className="mb-4 animate-slow-bounce text-accent" strokeWidth={2.5} />
      <h1 className="font-title text-h1 text-pencil">这一页空空如也</h1>
      <p className="mt-2 font-hand text-body text-pencil/60">也许它还没被写进这本菜谱。</p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        回到首页
      </Button>
    </div>
  );
}
