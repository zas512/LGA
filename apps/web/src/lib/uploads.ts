/**
 * Signed Cloudinary upload flow for onboarding assets (firm logo, user avatar).
 *
 * Mirrors `components/tasks/cloudinary.ts` but hits the auth-scoped signature
 * endpoint and stores files under the `lga/onboarding` folder. The API issues a
 * one-time signature (secrets stay server-side); the browser then POSTs the raw
 * file straight to Cloudinary and keeps the returned secure_url. No file bytes
 * are proxied through Nest, and the API secret never reaches the client.
 */

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

async function getOnboardingSignature(): Promise<UploadSignature> {
  const res = await fetch("/api/auth/uploads/signature");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "File uploads are not available");
  }
  return data as UploadSignature;
}

export interface UploadResult {
  secureUrl: string;
  publicId: string;
  mimeType: string;
  fileName: string;
}

export async function uploadOnboardingFile(file: File): Promise<UploadResult> {
  const sig = await getOnboardingSignature();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Upload to Cloudinary failed");
  }

  return {
    secureUrl: data.secure_url as string,
    publicId: data.public_id as string,
    mimeType: (file.type || "application/octet-stream") as string,
    fileName: file.name
  };
}
