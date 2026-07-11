/**
 * Two-phase media upload flow, kept separate from the UI so the backend can
 * be wired in without touching screens (see docs/BACKEND_API.md #9–11):
 *
 *   1. requestUploadSlots(media)  -> presigned URLs from the backend
 *   2. PUT each file directly to storage (progress per byte)
 *   3. finalizePost(meta)         -> backend creates the post, kicks off
 *                                    transcode + thumbnail extraction
 *
 * Until the backend exists, this module simulates the transfer so the UI
 * (progress, cancel, error states) is real and testable today.
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

/**
 * Upload picked media and create the post.
 * `onProgress` receives 0..1 across the whole batch.
 */
export const uploadPost = (
  media: PickedMedia[],
  meta: PostMeta,
  onProgress: (fraction: number) => void
): UploadHandle => {
  let cancelled = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const promise = new Promise<{ postId: string }>((resolve, reject) => {
    // TODO(backend): const slots = await api.requestMediaUpload(media.map(describe))
    // TODO(backend): for (const [i, m] of media.entries()) await putWithProgress(slots[i], m, onProgress)
    // TODO(backend): return api.createPost({ ...meta, mediaIds: slots.map(s => s.id) })

    // --- simulated transfer: bigger batches take proportionally longer ---
    const totalMs = 1200 + media.length * 500;
    const stepMs = 60;
    let elapsed = 0;
    timer = setInterval(() => {
      if (cancelled) {
        if (timer) clearInterval(timer);
        reject(new Error('cancelled'));
        return;
      }
      elapsed += stepMs;
      onProgress(Math.min(elapsed / totalMs, 1));
      if (elapsed >= totalMs) {
        if (timer) clearInterval(timer);
        resolve({ postId: `local-${Date.now()}` });
      }
    }, stepMs);
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
};
