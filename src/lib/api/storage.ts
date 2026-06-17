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

/** 上传前压缩：最大宽度 1600px，JPEG 80% */
export function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = Math.min(img.width, maxWidth);
      const h = Math.round((img.height * w) / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas 2d context'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('压缩失败'));
          const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}
