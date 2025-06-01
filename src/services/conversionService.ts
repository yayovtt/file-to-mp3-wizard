
export const convertToMp3 = async (file: File): Promise<Blob> => {
  // Simple conversion simulation without compression
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create a mock MP3 blob with similar size to original
      const mockMp3 = new Blob(['mock mp3 data'], { type: 'audio/mp3' });
      resolve(mockMp3);
    }, 1000); // Faster conversion time
  });
};
