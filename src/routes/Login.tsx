// 登录页：邮箱验证码 + Google OAuth，手绘草稿本封面感
import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, Mail, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';
import { signInWithEmail, verifyEmailOTP, signInWithGoogle } from '@/lib/api/auth';
import Button from '@/components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const justVerified = (location.state as { justVerified?: boolean } | null)?.justVerified ?? false;

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const codeRef = useRef<HTMLInputElement>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    const { error: err } = await signInWithEmail(email.trim());
    if (err) {
      setError(err.message);
      setSending(false);
    } else {
      setStep('code');
      setSending(false);
      // 等 DOM 更新后聚焦验证码输入框
      setTimeout(() => codeRef.current?.focus(), 50);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) return;
    setVerifying(true);
    setError('');
    const { error: err } = await verifyEmailOTP(email.trim(), code.trim());
    if (err) {
      setError(err.message);
      setVerifying(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err.message);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-wobbly border-[3px] border-pencil bg-white p-8 shadow-hand-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 rounded-wobbly-blob bg-postit p-3 inline-block">
            <ChefHat size={40} strokeWidth={2.5} className="text-accent" />
          </div>
          <h1 className="font-title text-h2 text-accent">寻味</h1>
          <p className="mt-1 font-hand text-meta text-pencil/60">让做菜变成手艺</p>
        </div>

        {justVerified && step === 'email' && (
          <div className="mb-5 flex items-start gap-2 rounded-wobbly-md border-2 border-pencil bg-postit px-3 py-2.5">
            <CheckCircle2 size={18} strokeWidth={2.5} className="mt-0.5 shrink-0 text-accent" />
            <p className="font-hand text-meta text-pencil">
              账号已注册成功！请在下方输入邮箱获取验证码登录。
            </p>
          </div>
        )}

        {step === 'email' ? (
          <>
            <form onSubmit={handleSendCode} className="space-y-3">
              <label className="block">
                <span className="mb-1 block font-hand text-body text-pencil">邮箱</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  required
                />
              </label>
              {error && (
                <p className="font-hand text-meta text-accent">{error}</p>
              )}
              <Button type="submit" disabled={sending} className="w-full justify-center">
                <Mail size={16} strokeWidth={2.5} />
                {sending ? '发送中…' : '发送验证码'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 border-t-2 border-dashed border-pencil/30" />
              <span className="font-hand text-meta text-pencil/50">或</span>
              <div className="flex-1 border-t-2 border-dashed border-pencil/30" />
            </div>

            <Button variant="outline" onClick={handleGoogleLogin} className="w-full justify-center">
              <ExternalLink size={16} strokeWidth={2.5} />
              用 Google 登录
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto rounded-wobbly-blob bg-postit p-4 inline-block">
                <Mail size={32} strokeWidth={2.5} className="text-pencil" />
              </div>
              <p className="mt-3 font-hand text-body text-pencil/70">
                验证码已发送到 {email}
              </p>
              <p className="font-hand text-meta text-pencil/50">
                请检查收件箱（包括垃圾邮件），输入 8 位验证码登录。
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-3">
              <label className="block">
                <span className="mb-1 block font-hand text-body text-pencil">验证码</span>
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  className="input text-center text-xl tracking-[0.3em]"
                  required
                />
              </label>
              {error && (
                <p className="font-hand text-meta text-accent">{error}</p>
              )}
              <Button type="submit" disabled={verifying || code.length < 8} className="w-full justify-center">
                <ArrowRight size={16} strokeWidth={2.5} />
                {verifying ? '验证中…' : '验证登录'}
              </Button>
            </form>

            <div className="text-center space-y-2 border-t-2 border-dashed border-pencil/20 pt-3">
              <button
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="font-hand text-meta text-accent underline hover:no-underline"
              >
                换邮箱 / 重新发送
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 font-hand text-xs text-pencil/50 text-center max-w-xs leading-relaxed">
        登录即表示同意我们的{' '}
        <button onClick={() => navigate('/privacy')} className="underline hover:text-accent">
          隐私政策
        </button>
        {' 和 '}
        <button onClick={() => navigate('/terms')} className="underline hover:text-accent">
          用户协议
        </button>
      </p>
    </div>
  );
}
