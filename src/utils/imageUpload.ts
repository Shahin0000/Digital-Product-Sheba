import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Converts a File object to an optimized Data URL using HTML5 Canvas.
 * Useful as a guaranteed fallback if Storage bucket permissions or CORS are restricted.
 */
export function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as WebP or PNG
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = (err) => reject(err);
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Firebase Storage with automatic Canvas Data URL fallback.
 */
export async function uploadBrandingImage(
  file: File,
  type: 'logo' | 'favicon'
): Promise<string> {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/x-icon', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|ico|svg)$/i)) {
    throw new Error('Unsupported image format. Please upload PNG, JPG, JPEG, or WEBP.');
  }

  // 1. Try Firebase Storage first if storage bucket is initialized
  try {
    const ext = file.name.split('.').pop() || 'png';
    const filename = `branding/${type}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(storageRef);
    if (downloadUrl) {
      return downloadUrl;
    }
  } catch (storageErr) {
    console.warn('Firebase Storage upload failed, using high-quality compressed data URL fallback:', storageErr);
  }

  // 2. High-quality compressed Data URL fallback
  const maxDim = type === 'favicon' ? 128 : 500;
  return await fileToOptimizedDataUrl(file, maxDim, maxDim, 0.9);
}
