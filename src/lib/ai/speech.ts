import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";

export interface TranscriptionResponse {
  transcript: string;
  summary: string;
  actionItems: string[];
  speakers?: string[];
  decisions?: string[];
  duration?: string;
}

export async function transcribeMeeting(audioRef: string, documentId: string): Promise<TranscriptionResponse> {
  if (!functions) throw new Error("Firebase Functions not initialized");

  const transcribeFn = httpsCallable<{ audioRef: string; documentId: string }, { success: boolean, data: TranscriptionResponse }>(
    functions, 
    "transcribeAudioNote"
  );

  const result = await transcribeFn({ audioRef, documentId });
  return result.data.data;
}
