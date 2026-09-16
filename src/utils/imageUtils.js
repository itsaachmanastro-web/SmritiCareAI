/**
 * SmritiCare Image & Avatar Utilities
 * 
 * Provides client-side image compression (<40KB WebP/JPEG) for offline IndexedDB persistence,
 * and deterministic initials/color generation for clean avatar fallbacks.
 */

// Deterministic gentle healthcare color palette for initials avatars
const AVATAR_PALETTES = [
  { bg: 'bg-teal-600 dark:bg-teal-500', text: 'text-white' },
  { bg: 'bg-emerald-600 dark:bg-emerald-500', text: 'text-white' },
  { bg: 'bg-indigo-600 dark:bg-indigo-500', text: 'text-white' },
  { bg: 'bg-cyan-600 dark:bg-cyan-500', text: 'text-white' },
  { bg: 'bg-amber-600 dark:bg-amber-500', text: 'text-white' },
  { bg: 'bg-rose-600 dark:bg-rose-500', text: 'text-white' },
  { bg: 'bg-sky-600 dark:bg-sky-500', text: 'text-white' },
  { bg: 'bg-violet-600 dark:bg-violet-500', text: 'text-white' },
];

/**
 * Extracts 1-2 character uppercase initials from a user's name.
 * e.g. "Rahul Das" -> "RD", "Bimala Borah (Amma)" -> "BB", "Amma" -> "A"
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  
  // Strip parentheses and content inside e.g. (Amma)
  const cleanName = name.replace(/\([^)]*\)/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically maps a name/email to one of the accessible avatar color palettes.
 */
export function getAvatarColor(nameOrEmail) {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') {
    return AVATAR_PALETTES[0];
  }
  let hash = 0;
  for (let i = 0; i < nameOrEmail.length; i++) {
    hash = (hash << 5) - hash + nameOrEmail.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

/**
 * Compresses an image file using an offscreen HTML5 Canvas.
 * Produces a lightweight Base64 string (<40KB) suitable for direct IndexedDB storage.
 * 
 * @param {File|Blob} file Image file from input[type="file"]
 * @param {Object} options Compression options
 * @param {number} [options.maxWidth=256] Max output width in pixels
 * @param {number} [options.maxHeight=256] Max output height in pixels
 * @param {number} [options.quality=0.82] JPEG/WebP quality (0.0 to 1.0)
 * @returns {Promise<{ base64: string, sizeBytes: number, format: string, width: number, height: number }>}
 */
export function compressImage(file, { maxWidth = 256, maxHeight = 256, quality = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No image file provided for compression.'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file must be a valid image (JPG, PNG, WebP).'));
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read selected image file.'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale dimensions proportionally to fit inside maxWidth x maxHeight
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Offscreen canvas for downsampling
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Could not initialize canvas 2D rendering context.'));
          }

          // Use high quality bicubic image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting as image/webp first; fallback to image/jpeg if webp not supported
          let base64 = canvas.toDataURL('image/webp', quality);
          let format = 'image/webp';
          if (!base64.startsWith('data:image/webp')) {
            base64 = canvas.toDataURL('image/jpeg', quality);
            format = 'image/jpeg';
          }

          const sizeBytes = Math.round((base64.length * 3) / 4);

          resolve({
            base64,
            sizeBytes,
            format,
            width,
            height
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}
