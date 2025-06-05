
/**
 * Resizes an image file to a target maximum width/height and aims for a target file size.
 * @param file The image file to resize.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @param targetKB The target file size in kilobytes.
 * @param mimeType The desired MIME type for the output image (e.g., 'image/jpeg', 'image/webp').
 * @returns A Promise that resolves to the resized File object, or the original file if resizing isn't needed or fails.
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  targetKB: number = 200,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<File> {
  return new Promise((resolve, reject) => {
    // If the original file is already small enough, return it.
    // Add a bit of buffer to targetKB as compression is not exact.
    if (file.size / 1024 <= targetKB * 1.1 && file.type === mimeType) {
      // console.log('Original image small enough, not resizing.');
      // resolve(file);
      // return;
      // Always attempt resize to ensure dimensions and consistent format if desired
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

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
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // console.error('Could not get canvas context');
        resolve(file); // Fallback to original file
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Adjust quality dynamically to try and meet targetKB
      // This is a heuristic and might need several attempts or more sophisticated logic for precision.
      // For simplicity, we'll try a few common quality settings.
      // WebP generally offers better compression.
      const preferredMimeType = mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
      const qualityLevels = preferredMimeType === 'image/webp' ? [0.85, 0.75, 0.65] : [0.9, 0.8, 0.7];
      
      let currentBlob: Blob | null = null;
      let currentQuality = qualityLevels[0];

      const attemptConversion = (quality: number) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              currentBlob = blob;
              // console.log(`Resized to: ${(blob.size / 1024).toFixed(2)}KB with quality ${quality}`);
              if (blob.size / 1024 > targetKB && quality > qualityLevels[qualityLevels.length -1]) {
                  const nextQualityIndex = qualityLevels.indexOf(quality) + 1;
                  if(nextQualityIndex < qualityLevels.length) {
                    attemptConversion(qualityLevels[nextQualityIndex]);
                    return;
                  }
              }
              
              const resizedFile = new File([blob], file.name.substring(0, file.name.lastIndexOf('.')) + (preferredMimeType === 'image/webp' ? '.webp' : '.jpg'), {
                type: preferredMimeType,
                lastModified: Date.now(),
              });
              resolve(resizedFile);

            } else {
              // console.error('Canvas toBlob failed');
              resolve(file); // Fallback to original file
            }
          },
          preferredMimeType,
          quality
        );
      };
      
      attemptConversion(currentQuality);

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      // console.error('Failed to load image for resizing.');
      resolve(file); // Fallback to original file
    };
  });
}
