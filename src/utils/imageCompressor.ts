/**
 * Utility to compress and resize images client-side before storing in SQLite/localStorage.
 * Guarantees that uploaded images stay small (typically 25KB - 45KB), preventing
 * SQLite storage and localStorage quota exceeded errors.
 */
export function compressImage(
  file: File,
  maxWidth = 750,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Il file non è un formato immagine valido'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Errore di lettura del file'));
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Impossibile decodificare l'immagine"));
      img.onload = () => {
        let { width, height } = img;

        // Scale down proportionally keeping vertical 3:4 aspect or original proportions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Fill background white in case of transparent png
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with quality factor (typically 25KB - 40KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
