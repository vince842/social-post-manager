// Convert a File into a 3:2 (1200x800) JPEG data URL by center-cover cropping.
export async function fileTo3x2DataUrl(file: File, width = 1200): Promise<string> {
  const height = Math.round((width * 2) / 3);
  const bitmap = await loadImage(file);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");

  // Cover crop: scale the source so it fills the 3:2 canvas, center it.
  const srcRatio = bitmap.width / bitmap.height;
  const dstRatio = width / height;
  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (srcRatio > dstRatio) {
    // Source is wider → crop sides
    sw = bitmap.height * dstRatio;
    sx = (bitmap.width - sw) / 2;
  } else if (srcRatio < dstRatio) {
    // Source is taller → crop top/bottom
    sh = bitmap.width / dstRatio;
    sy = (bitmap.height - sh) / 2;
  }

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
