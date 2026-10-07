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
 * Uploads an image to Firebase Storage with persistent Firestore cloud fallback.
 * Guarantees progress reporting and promise resolution without hanging.
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

  if (onProgress) onProgress(20);

  const rawExt = file.name.split('.').pop()?.toLowerCase() || (type === 'favicon' ? 'ico' : 'png');
  const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const storagePath = `business/branding/${type}.${ext}`;

  // 3. Primary Architecture: Persistent Firebase Storage upload via uploadBytes
  try {
    if (onProgress) onProgress(45);
    const storageRef = ref(storage, storagePath);

    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type || (type === 'favicon' ? 'image/x-icon' : 'image/png'),
      customMetadata: {
        brandingType: type,
        updatedAt: new Date().toISOString(),
      },
    });

    if (onProgress) onProgress(85);
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    if (onProgress) onProgress(100);
    return downloadUrl;
  } catch (storageErr: any) {
    console.warn(
      `[Branding Upload] Firebase Storage upload error (${storageErr?.message || storageErr}). Storing optimized persistent image directly in Firestore settings.`,
    );

    // Safe persistent cloud fallback: encode as optimized Data URL stored in Firestore settings/global
    // Does NOT depend on server filesystem or ephemeral disk.
    try {
      if (onProgress) onProgress(75);
      const maxDim = type === 'favicon' ? 128 : 500;
      const optimizedDataUrl = await fileToOptimizedDataUrl(file, maxDim, maxDim, 0.9);
      if (onProgress) onProgress(100);
      return optimizedDataUrl;
    } catch (fallbackErr: any) {
      throw new Error(`Upload failed: ${storageErr?.message || storageErr}`);
    }
  }
}
