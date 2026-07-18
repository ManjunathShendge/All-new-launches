import { S3Client } from "@aws-sdk/client-s3";

// Server-only R2 (Cloudflare) config. R2 speaks the S3 API.
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET ?? "";
// Public base URL for delivery (r2.dev dev URL or a custom domain).
export const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(
  /\/$/,
  ""
);

export function isR2Configured(): boolean {
  return Boolean(
    accountId && accessKeyId && secretAccessKey && R2_BUCKET && R2_PUBLIC_URL
  );
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId ?? "",
      secretAccessKey: secretAccessKey ?? "",
    },
  });
}
