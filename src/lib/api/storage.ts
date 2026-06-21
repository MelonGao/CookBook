// 封面图上传 / 删除（Supabase Storage）
import { supabase } from '../supabase';

/** 上传图片到 recipe-covers bucket，返回公开 URL（封面图与正文内嵌图片共用） */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from('recipe-covers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('recipe-covers')
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/** 上传封面（语义别名，内部与 uploadImage 一致） */
export const uploadCover = uploadImage;

/** 删除封面（根据公开 URL 反推路径） */
export async function deleteCover(url: string): Promise<void> {
  const bucketPrefix = '/recipe-covers/';
  const idx = url.indexOf(bucketPrefix);
  if (idx === -1) return;
  const path = url.slice(idx + bucketPrefix.length);
  const { error } = await supabase.storage.from('recipe-covers').remove([path]);
  if (error) console.error('[storage] 删除封面失败', error);
}

/** 上传前压缩：最大宽度 1600px，JPEG 80%。
 *  用 FileReader → data URL 而不是 URL.createObjectURL，避免某些浏览器扩展
 *  拦截 blob: 协议导致 img 既不 onload 也不 onerror、整个 Promise 永远挂着。
 *  另加 15s 超时兜底，确保上层 setUploading(false) 一定会被触发。
 */
export function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('图片处理超时（15s）')), 15_000);
    const done = (val: File | Error) => {
      clearTimeout(timer);
      val instanceof Error ? reject(val) : resolve(val);
    };

    const reader = new FileReader();
    reader.onerror = () => done(new Error('文件读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w = Math.min(img.width, maxWidth);
        const h = Math.round((img.height * w) / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return done(new Error('canvas 2d context'));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) return done(new Error('压缩失败'));
            done(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => done(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
