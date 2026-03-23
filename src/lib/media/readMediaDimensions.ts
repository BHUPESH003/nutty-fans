/**
 * Read intrinsic dimensions from a local file (browser only).
 * Used when confirming uploads so feed layout can match aspect ratio.
 */

export async function readMediaDimensionsFromFile(
  file: File
): Promise<{ width?: number; height?: number }> {
  if (file.type.startsWith('video/')) {
    return readVideoDimensions(file);
  }
  if (file.type.startsWith('image/')) {
    return readImageDimensions(file);
  }
  return {};
}

function readVideoDimensions(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const finish = (w?: number, h?: number) => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      if (w && h && w > 0 && h > 0) resolve({ width: w, height: h });
      else resolve({});
    };

    video.onloadedmetadata = () => {
      finish(video.videoWidth, video.videoHeight);
    };
    video.onerror = () => {
      finish();
    };
    video.src = url;
  });
}

function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) resolve({ width: w, height: h });
      else resolve({});
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({});
    };
    img.src = url;
  });
}
