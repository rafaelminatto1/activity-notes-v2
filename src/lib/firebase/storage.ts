import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { storage } from "./config";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_COVER_WIDTH = 1400;
const COMPRESSION_QUALITY = 0.8;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getStorageInstance() {
  if (!storage) throw new Error("Firebase Storage não inicializado. Verifique suas chaves de API.");
  return storage;
}

function validateImage(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. O tamanho máximo é 5MB.");
  }
}

export type ProgressCallback = (progress: number) => void;

async function compressImage(file: File, maxWidth?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      const targetWidth = maxWidth || width;

      if (width > targetWidth) {
        height = Math.round((height * targetWidth) / width);
        width = targetWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Falha ao criar contexto de canvas."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Falha ao comprimir imagem."));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar imagem."));
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

  const compressed = await compressImage(file, MAX_COVER_WIDTH);
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
        reject(new Error(`Falha no upload da capa: ${error.message}`));
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
