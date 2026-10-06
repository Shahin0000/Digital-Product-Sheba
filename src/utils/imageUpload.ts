import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
 * Uploads an image to Firebase Storage with automatic server and canvas fallbacks.
 * Emits real upload progress and guarantees promise resolution without hanging.
 */
export async function uploadBrandingImage(
  file: File,
  type: 'logo' | 'favicon',
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  if (!file) {
    throw new Error('Please select an image file to upload.');
  }

  // 1. Validate File Format
  const allowedMimes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/svg+xml',
  ];
  const fileExtMatch = file.name.match(/\.(png|jpe?g|webp|ico|svg)$/i);
  if (!allowedMimes.includes(file.type.toLowerCase()) && !fileExtMatch) {
    throw new Error('Unsupported image format. Allowed formats: PNG, JPG, JPEG, WEBP, ICO, SVG.');
  }

  // 2. Validate File Size (Max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('File size exceeds the 5MB limit. Please upload a smaller image.');
  }

  if (onProgress) onProgress(15);

  const rawExt = file.name.split('.').pop()?.toLowerCase() || (type === 'favicon' ? 'ico' : 'png');
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const storagePath = `business/branding/${type}.${ext}`;

  // 3. Attempt Firebase Storage upload with uploadBytesResumable (racing against 6-second timeout)
  try {
    const storagePromise = new Promise<string>((resolve, reject) => {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/png',
        customMetadata: {
          brandingType: type,
          updatedAt: new Date().toISOString(),
        },
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 75) + 15;
            if (onProgress) onProgress(Math.min(90, pct));
          }
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (urlErr) {
            reject(urlErr);
          }
        }
      );
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 6000)
    );

    const downloadUrl = await Promise.race([storagePromise, timeoutPromise]);
    if (downloadUrl) {
      if (onProgress) onProgress(100);
      return downloadUrl;
    }
  } catch (storageErr) {
    console.warn(
      `[Branding Upload] Firebase Storage upload could not complete (${storageErr instanceof Error ? storageErr.message : storageErr}). Using backend persistent branding store.`
    );
  }

  // 4. Server-side static upload fallback (/api/branding/upload)
  try {
    if (onProgress) onProgress(60);
    const dataUrl = await fileToOptimizedDataUrl(file, type === 'favicon' ? 128 : 600, type === 'favicon' ? 128 : 600, 0.92);

    const response = await fetch('/api/branding/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        dataUrl,
        fileName: file.name,
        mimeType: file.type || 'image/png',
      }),
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.url) {
        if (onProgress) onProgress(100);
        return resData.url;
      }
    }
  } catch (serverErr) {
    console.warn('[Branding Upload] Server upload fallback failed, using optimized canvas Data URL:', serverErr);
  }

  // 5. High-quality compressed Canvas Data URL (guaranteed standalone fallback)
  if (onProgress) onProgress(90);
  const maxDim = type === 'favicon' ? 128 : 500;
  const optimizedDataUrl = await fileToOptimizedDataUrl(file, maxDim, maxDim, 0.9);
  if (onProgress) onProgress(100);
  return optimizedDataUrl;
}
