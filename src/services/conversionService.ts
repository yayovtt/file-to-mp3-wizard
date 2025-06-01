
export const convertToMp3 = async (file: File): Promise<Blob> => {
  // Simulate conversion with compression
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a smaller mock blob to simulate compression
      const compressedSize = Math.max(file.size * 0.3, 1024); // 30% of original size
      const mockMp3 = new Blob(['mock mp3 data'], { type: 'audio/mp3' });
      resolve(mockMp3);
    }, 2000);
  });
};
