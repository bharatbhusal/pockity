export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1920; // set resolution to 1080p (1920x1080 max width)
      const scaleSize = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scaleSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Failed to get canvas context");

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Compress directly at 60% quality
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Compression failed");

          const compressed = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        file.type,
        0.6, // 60% quality = ~40% compression
      );
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
