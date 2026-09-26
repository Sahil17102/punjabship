import axiosInstance from "./axiosInstance";

export interface UploadedObject {
  key: string;
  publicUrl: string;
  bucket: string;
}

const transientUploadStatus = new Set([408, 425, 429, 500, 502, 503, 504]);

const isTransientUploadError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: string;
    response?: { status?: number; data?: { retryable?: boolean } };
  };
  const status = Number(candidate.response?.status || 0);
  return (
    candidate.response?.data?.retryable === true ||
    transientUploadStatus.has(status) ||
    ["ECONNABORTED", "ERR_NETWORK", "ETIMEDOUT"].includes(String(candidate.code || ""))
  );
};

const createUploadId = () => {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const uploadEmbeddedShopifyFile = async (
  file: File,
  folder: string | undefined,
  onProgress: (percent: number) => void,
): Promise<UploadedObject> => {
  const uploadId = createUploadId();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("folder", folder || "userPp");
    body.append("uploadId", uploadId);

    try {
      const response = await axiosInstance.post<UploadedObject>("/uploads/shopify-file", body, {
        timeout: 90000,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) onProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      return response.data;
    } catch (error) {
      if (attempt === 2 || !isTransientUploadError(error)) throw error;
      onProgress(0);
      await new Promise((resolve) => window.setTimeout(resolve, 750));
    }
  }

  throw new Error("Upload failed");
};

export const uploadAuthenticatedFile = async (
  file: File,
  folder: string | undefined,
  onProgress: (percent: number) => void,
): Promise<UploadedObject> => {
  const uploadId = createUploadId();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("folder", folder || "userPp");
    body.append("uploadId", uploadId);

    try {
      const response = await axiosInstance.post<UploadedObject>("/uploads/file", body, {
        timeout: 90000,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) onProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      return response.data;
    } catch (error) {
      if (attempt === 2 || !isTransientUploadError(error)) throw error;
      onProgress(0);
      await new Promise((resolve) => window.setTimeout(resolve, 750));
    }
  }

  throw new Error("Upload failed");
};

export const getPresignedDownloadUrls = async (
  keys: string | string[]
): Promise<string | Array<string | null>> => {
  const response = await axiosInstance.post("/uploads/presign-download-url", {
    keys,
  });

  if (Array.isArray(keys)) {
    return (response.data.urls || []) as Array<string | null>;
  } else {
    return response.data.url as string;
  }
};
