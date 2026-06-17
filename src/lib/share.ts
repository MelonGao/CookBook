// 分享：用 html2canvas 把指定 DOM 节点导出为 PNG 并触发下载
import html2canvas from 'html2canvas';

export async function exportNodeAsImage(node: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(node, {
    backgroundColor: '#FAF7F2',
    scale: 2, // 高清导出
    useCORS: true,
    logging: false,
  });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  a.click();
}
