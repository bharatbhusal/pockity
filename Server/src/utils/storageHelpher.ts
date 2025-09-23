export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileCategory(extension: string): string {
  const categories: Record<string, string> = {
    // Images
    jpg: "Images",
    jpeg: "Images",
    png: "Images",
    gif: "Images",
    bmp: "Images",
    svg: "Images",
    webp: "Images",
    tiff: "Images",
    ico: "Images",

    // Videos
    mp4: "Videos",
    avi: "Videos",
    mov: "Videos",
    wmv: "Videos",
    flv: "Videos",
    webm: "Videos",
    mkv: "Videos",
    "3gp": "Videos",

    // Audio
    mp3: "Audio",
    wav: "Audio",
    flac: "Audio",
    aac: "Audio",
    ogg: "Audio",
    wma: "Audio",
    m4a: "Audio",

    // Documents
    pdf: "Documents",
    doc: "Documents",
    docx: "Documents",
    xls: "Documents",
    xlsx: "Documents",
    ppt: "Documents",
    pptx: "Documents",
    txt: "Documents",
    rtf: "Documents",
    odt: "Documents",

    // Archives
    zip: "Archives",
    rar: "Archives",
    "7z": "Archives",
    tar: "Archives",
    gz: "Archives",
    bz2: "Archives",

    // Code
    js: "Code",
    ts: "Code",
    html: "Code",
    css: "Code",
    py: "Code",
    java: "Code",
    cpp: "Code",
    c: "Code",
    php: "Code",
    rb: "Code",
  };

  return categories[extension] || "Other";
}
