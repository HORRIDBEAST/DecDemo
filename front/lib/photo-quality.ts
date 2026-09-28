import * as tf from '@tensorflow/tfjs';

// Deliberately not a trained model - a fixed 3x3 Laplacian kernel (the standard
// "no ML required" edge-detection trick) applied via TF.js's conv2d. Its output's
// variance is a well-known, simple proxy for how much sharp detail an image has:
// high variance = lots of edges = in focus, low variance = few edges = blurry.
const LAPLACIAN_KERNEL = tf.tensor4d([0, 1, 0, 1, -4, 1, 0, 1, 0], [3, 3, 1, 1]);

// 0-255 grayscale scale. Tuned loosely, not measured against a labelled dataset -
// good enough to catch an obviously-dark or obviously-blurred phone photo without
// being so strict it rejects normal ones. Adjust if it's too trigger-happy in testing.
const DARKNESS_MEAN_THRESHOLD = 35;
const BLUR_VARIANCE_THRESHOLD = 60;

// Downscaling keeps the convolution fast (well under 100ms on a phone) and keeps
// the variance threshold meaningful regardless of the camera's native resolution.
const ANALYSIS_MAX_DIMENSION = 400;

export interface PhotoQualityResult {
  ok: boolean;
  reason?: string;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Client-side, in-WebView quality pre-check for a claim damage photo. Flags photos
 * that are too dark or too blurry to be useful evidence, before they're uploaded.
 * Runs entirely in TensorFlow.js's browser backend - no server call, no native
 * dependency, no downloaded model weights.
 */
export async function checkPhotoQuality(file: File): Promise<PhotoQualityResult> {
  let img: HTMLImageElement;
  try {
    img = await loadImageElement(file);
  } catch {
    // If we can't even decode it as an image, don't block the upload on our own
    // bug - let the normal upload/backend validation handle it instead.
    return { ok: true };
  }

  return tf.tidy(() => {
    const scale = Math.min(1, ANALYSIS_MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: true };
    ctx.drawImage(img, 0, 0, w, h);

    const gray = tf.browser.fromPixels(canvas).mean(2).toFloat(); // [h, w], 0-255
    const meanBrightness = gray.mean().dataSync()[0];

    if (meanBrightness < DARKNESS_MEAN_THRESHOLD) {
      return { ok: false, reason: 'Photo looks too dark. Please retake it with better lighting.' };
    }

    const input = gray.reshape([1, h, w, 1]) as tf.Tensor4D;
    const edges = tf.conv2d(input, LAPLACIAN_KERNEL, 1, 'same');
    const blurVariance = tf.moments(edges).variance.dataSync()[0];

    if (blurVariance < BLUR_VARIANCE_THRESHOLD) {
      return { ok: false, reason: 'Photo looks blurry. Please hold the camera steady and retake it.' };
    }

    return { ok: true };
  });
}
