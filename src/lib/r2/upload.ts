import { getR2UploadUrl } from "@/lib/actions/upload.action";

/**
 * Downscale + re-encode an image in the browser before upload so R2 storage
 * (and delivery) stays lean on the free tier. GIFs and non-images pass through.
 */
export async function compressImage(
  file: File,
  maxDim = 2000,
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file; // fall back to the original on any decode error
  }
}

/** Upload a file directly to R2 via a presigned URL. Returns the public URL. */
export async function uploadFileToR2(file: File): Promise<string> {
  const res = await getR2UploadUrl(file.name, file.type);
  if (!res.ok || !res.uploadUrl || !res.publicUrl) {
    throw new Error(res.error ?? "Upload is not available.");
  }
  const put = await fetch(res.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status}).`);
  return res.publicUrl;
}
