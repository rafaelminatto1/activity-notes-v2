import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./config";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (more flexible, compression will reduce it)
const DEFAULT_MAX_WIDTH = 1600;
const COMPRESSION_QUALITY = 0.7; // Lowered for better space saving
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

function getStorageInstance() {
  if (!storage) throw new Error("Firebase Storage não inicializado. Verifique suas chaves de API.");
  return storage;
}

function validateImage(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Use JPEG, PNG, WebP, GIF ou AVIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. O tamanho máximo é 10MB.");
  }
}

export type ProgressCallback = (progress: number) => void;

/**
 * Optimizador de imagens: downscale + conversão para WebP
 */
async function compressImage(file: File, maxWidth: number = DEFAULT_MAX_WIDTH): Promise<Blob> {
  // GIFs don't benefit from canvas compression (it would make them static)
  if (file.type === "image/gif") return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      
      // Calculate new dimensions keeping aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Falha ao criar contexto de canvas."));
        return;
      }

      // Draw with smoothing for better quality during downscale
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP (highly efficient)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falha ao gerar blob de imagem."));
            return;
          }
          // Only use the compressed version if it's actually smaller than original
          if (blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem para compressão."));
    };

    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  userId: string,
  path: string = "covers",
  onProgress?: ProgressCallback
): Promise<string> {
  validateImage(file);

  const compressed = await compressImage(file);
  const fileName = `${Date.now()}-${file.name.replace(/\.[^.]+$/, ".webp")}`;
  const storageRef = ref(getStorageInstance(), `${path}/${userId}/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressed, {
      contentType: "image/webp",
    });

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error("Storage upload error:", error);
        reject(new Error(`Falha no upload: ${error.message}`));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function uploadCoverImage(
  file: File,
  userId: string,
  docId: string,
  onProgress?: ProgressCallback
): Promise<string> {
  validateImage(file);

  const compressed = await compressImage(file, 1920); // Cover needs higher resolution
  const fileName = `${docId}-${Date.now()}.webp`;
  const storageRef = ref(getStorageInstance(), `covers/${userId}/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, compressed, {
      contentType: "image/webp",
    });

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        console.error("Storage cover upload error:", error);
        reject(new Error(`Falha no upload da capa: ${error.message}`));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function uploadFile(
  file: File,
  userId: string,
  path: string = "attachments",
  onProgress?: ProgressCallback
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(getStorageInstance(), `${path}/${userId}/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }
      },
      (error) => {
        reject(new Error(`Falha no upload do arquivo: ${error.message}`));
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(getStorageInstance(), imageUrl);
    await deleteObject(storageRef);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "storage/object-not-found") return;
    throw new Error("Falha ao excluir imagem.");
  }
}
