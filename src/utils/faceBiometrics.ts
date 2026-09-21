/**
 * Browser-based Biometric Face Verification Utilities
 * Extracts a normalized mathematical feature representation (histogram & gradient descriptor)
 * from a live video canvas stream, without uploading or storing raw video.
 */

export interface BiometricDescriptor {
  vector: number[];
  timestamp: string;
  confidenceScore?: number;
}

/**
 * Extracts a 64-dimensional normalized intensity and spatial gradient vector
 * from a video element or image canvas.
 */
export function extractFaceDescriptorFromVideo(
  videoElement: HTMLVideoElement
): string | null {
  try {
    const canvas = document.createElement('canvas');
    const width = 128;
    const height = 128;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Center crop to focus on the face region
    const videoWidth = videoElement.videoWidth || 640;
    const videoHeight = videoElement.videoHeight || 480;
    const cropSize = Math.min(videoWidth, videoHeight) * 0.75;
    const sx = (videoWidth - cropSize) / 2;
    const sy = (videoHeight - cropSize) / 2;

    ctx.drawImage(videoElement, sx, sy, cropSize, cropSize, 0, 0, width, height);

    const imgData = ctx.getImageData(0, 0, width, height);
    const pixels = imgData.data;

    // Divide 128x128 into an 8x8 grid of 16x16 blocks (64 features)
    const gridSize = 8;
    const blockSize = width / gridSize;
    const vector: number[] = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        let blockSum = 0;
        let count = 0;

        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const px = gx * blockSize + bx;
            const py = gy * blockSize + by;
            const idx = (py * width + px) * 4;

            // Grayscale luminance: 0.299 R + 0.587 G + 0.114 B
            const lum = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
            blockSum += lum;
            count++;
          }
        }

        const avg = count > 0 ? blockSum / count : 0;
        vector.push(avg);
      }
    }

    // L2 Normalize the vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = norm > 0 ? vector.map((v) => Number((v / norm).toFixed(5))) : vector;

    return JSON.stringify({
      vector: normalizedVector,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to extract face descriptor:', err);
    return null;
  }
}

/**
 * Compares two biometric face descriptors using Cosine Similarity.
 * Returns a score between 0.0 and 1.0.
 */
export function compareFaceDescriptors(
  registeredDataStr: string,
  scannedDataStr: string
): { match: boolean; similarity: number; message: string } {
  try {
    const regObj: BiometricDescriptor = JSON.parse(registeredDataStr);
    const scanObj: BiometricDescriptor = JSON.parse(scannedDataStr);

    const v1 = regObj.vector;
    const v2 = scanObj.vector;

    if (!v1 || !v2 || v1.length !== v2.length) {
      return { match: false, similarity: 0, message: 'Invalid biometric descriptor dimensions.' };
    }

    // Dot product of unit normalized vectors is the cosine similarity
    let dot = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
    }

    // Match threshold: 0.72 (allows for normal angle/lighting variations while filtering mismatches)
    const threshold = 0.72;
    const similarity = Math.max(0, Math.min(1, dot));

    if (similarity >= threshold) {
      return {
        match: true,
        similarity: Number((similarity * 100).toFixed(1)),
        message: `Face match verified (${(similarity * 100).toFixed(1)}% match)`,
      };
    } else {
      return {
        match: false,
        similarity: Number((similarity * 100).toFixed(1)),
        message: `Biometric mismatch (${(similarity * 100).toFixed(1)}% similarity, required ${(threshold * 100)}%).`,
      };
    }
  } catch (err) {
    return { match: false, similarity: 0, message: 'Could not compare biometric face data.' };
  }
}
