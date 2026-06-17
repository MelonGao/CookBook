// Markdown 渲染 —— react-markdown + remark-gfm（表格/勾选框/删除线），书页感排版
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/cn';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownView({ content, className }: Props) {
  return (
    <div className={cn('prose-cookbook', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
