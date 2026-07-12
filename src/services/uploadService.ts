import { File } from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { api } from '../utils/api';
import type { CreatePostMedia, UploadSlot } from '../types/index';

/**
 * Real two-phase media upload (docs/BACKEND_API.md #9-11 are now live):
 *
 *   1. api.requestUploadSlots(files) -> presigned URLs from the backend
 *   2. PUT each file directly to its presigned URL (client never proxies
 *      media through the API server)
 *   3. api.finalizePost(...)         -> backend creates the post
 *
 * Video posts additionally generate a poster-frame thumbnail on-device
 * (expo-video-thumbnails) and upload it as its own image slot — the
 * backend requires thumbnailPath for every video post.
 */

export interface PickedMedia {
  uri: string;
  type: 'video' | 'image';
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  /** Video duration in milliseconds, when the picker provides it. */
  durationMs?: number;
  width?: number;
  height?: number;
}

export interface PostMeta {
  kind: 'reel' | 'carousel';
  caption: string;
  eventTags: string[];
}

export interface UploadHandle {
  /** Resolves with the created post id, or rejects on failure/cancel. */
  promise: Promise<{ postId: string }>;
  /** Abort the in-flight upload. */
  cancel: () => void;
}

const inferContentType = (m: PickedMedia): string => {
  if (m.mimeType) return m.mimeType;
  return m.type === 'video' ? 'video/mp4' : 'image/jpeg';
};

const inferFileName = (m: PickedMedia, index: number): string => {
  if (m.fileName) return m.fileName;
  return m.type === 'video' ? `upload-${Date.now()}-${index}.mp4` : `upload-${Date.now()}-${index}.jpg`;
};

const putFile = async (uploadUrl: string, uri: string, contentType: string, signal: AbortSignal) => {
  const file = new File(uri);
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file as unknown as BodyInit,
    signal,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
};

/**
 * Upload picked media and create the post.
 * `onProgress` receives 0..1 across the whole batch (per-file granularity —
 * the UI shows one bar for the batch, not per-byte precision).
 */
export const uploadPost = (
  media: PickedMedia[],
  meta: PostMeta,
  onProgress: (fraction: number) => void
): UploadHandle => {
  const controller = new AbortController();

  const promise = (async (): Promise<{ postId: string }> => {
    // 1) Video posts need a poster-frame thumbnail, generated on-device —
    //    required by the backend as thumbnailPath.
    let thumbnailUri: string | null = null;
    if (meta.kind === 'reel' && media[0]) {
      const thumb = await VideoThumbnails.getThumbnailAsync(media[0].uri, { time: 0 });
      thumbnailUri = thumb.uri;
    }

    // 2) One presigned slot per file, plus the thumbnail if present.
    const fileDescriptors = media.map((m, i) => ({
      fileName: inferFileName(m, i),
      contentType: inferContentType(m),
    }));
    if (thumbnailUri) {
      fileDescriptors.push({ fileName: `thumb-${Date.now()}.jpg`, contentType: 'image/jpeg' });
    }

    const { data } = await api.requestUploadSlots(fileDescriptors);
    const slots: UploadSlot[] = data.slots;
    const mediaSlots = slots.slice(0, media.length);
    const thumbnailSlot = thumbnailUri ? slots[media.length] : undefined;

    // 3) PUT every file directly to storage.
    const totalUploads = slots.length;
    let completed = 0;
    const bump = () => {
      completed += 1;
      onProgress(completed / totalUploads);
    };

    for (let i = 0; i < media.length; i++) {
      await putFile(mediaSlots[i].uploadUrl, media[i].uri, fileDescriptors[i].contentType, controller.signal);
      bump();
    }
    if (thumbnailUri && thumbnailSlot) {
      await putFile(thumbnailSlot.uploadUrl, thumbnailUri, 'image/jpeg', controller.signal);
      bump();
    }

    // 4) Finalize the post.
    const createPostMedia: CreatePostMedia[] = media.map((m, i) => ({
      path: mediaSlots[i].path,
      type: m.type,
      thumbnailPath: meta.kind === 'reel' ? thumbnailSlot?.path : undefined,
      durationMs: m.durationMs,
      aspectRatio: m.width && m.height ? m.width / m.height : undefined,
    }));

    const { data: post } = await api.finalizePost({
      type: meta.kind === 'reel' ? 'video' : 'carousel',
      caption: meta.caption || undefined,
      eventTags: meta.eventTags,
      media: createPostMedia,
    });

    return { postId: post.id };
  })();

  return {
    promise,
    cancel: () => controller.abort(),
  };
};
