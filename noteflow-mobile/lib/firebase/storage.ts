import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';
import * as ImagePicker from 'expo-image-picker';

export async function uploadImage(
  userId: string,
  uri: string,
  path: string = 'documents'
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${path}/${userId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
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
