// Phone cameras produce 3–12 MB photos (HEIC on many iPhones), well over the
// server's upload limits (2 MB avatar, 5 MB board photo, 8 MB background) —
// so uploads from a phone were rejected, after first crawling up over mobile
// data. Downscale and re-encode to JPEG in the browser before uploading.

const PASSTHROUGH_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PASSTHROUGH_BYTES = 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("decode failed")); };
    img.src = url;
  });
}

function isHeic(file) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

/**
 * Returns a File ready to upload: the original if it's already small and in
 * a web format, otherwise a JPEG whose longest side is at most `maxSize`.
 * Browsers apply EXIF orientation when drawing, so phone photos stay upright.
 */
export async function prepareImage(file, { maxSize = 2048, quality = 0.85 } = {}) {
  if (!file) return file;
  // small web-format files go up untouched (keeps GIF animation / PNG alpha)
  if (PASSTHROUGH_TYPES.includes(file.type) && file.size <= PASSTHROUGH_BYTES) return file;

  let img;
  try {
    img = await loadImage(file);
  } catch {
    // Safari decodes HEIC, but most other browsers can't — and neither can
    // the server, nor could other people's browsers display it
    if (isHeic(file)) throw new Error("This photo format (HEIC) isn't supported here. Please choose a JPEG or PNG.");
    return file; // let the server's own validation give the verdict
  }

  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // JPEG has no alpha — transparent areas would turn black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) return file;
  const name = `${file.name.replace(/\.[^.]*$/, "") || "photo"}.jpg`;
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
