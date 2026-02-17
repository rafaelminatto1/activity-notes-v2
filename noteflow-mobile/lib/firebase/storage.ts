import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';
import * as ImagePicker from 'expo-image-picker';

export async function uploadImage(
  userId: string,
  uri: string,
  path: string = 'covers'
): Promise<string> {
  // For React Native, especially Android, fetch() with file:// URIs can be unstable.
  // Using XMLHttpRequest to get the blob is more reliable.
  const blob: Blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error('XHR error:', e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });

  const filename = `${path}/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  
  try {
    await uploadBytes(storageRef, blob);
    // Important: Close the blob to free up memory
    if (typeof (blob as any).close === 'function') {
      (blob as any).close();
    }
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw error;
  }
}

export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch {
    // Image may not exist, ignore error
  }
}

export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}
