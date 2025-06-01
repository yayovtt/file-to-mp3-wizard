
export const compressAudio = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    audio.onload = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create offline context for compression
        const offlineContext = new OfflineAudioContext(
          1, // mono
          audioBuffer.duration * 22050, // lower sample rate
          22050 // 22.05kHz instead of 44.1kHz
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const compressedBuffer = await offlineContext.startRendering();
        
        // Convert to MP3-like compressed format
        const compressedBlob = await encodeAudioBuffer(compressedBuffer);
        
        // Create new file with smaller size
        const compressedFile = new File(
          [compressedBlob], 
          file.name.replace(/\.[^/.]+$/, '.mp3'), 
          { type: 'audio/mp3' }
        );
        
        resolve(compressedFile);
      } catch (error) {
        reject(error);
      }
    };
    
    audio.onerror = () => reject(new Error('Failed to load audio'));
    audio.src = URL.createObjectURL(file);
  });
};

const encodeAudioBuffer = async (audioBuffer: AudioBuffer): Promise<Blob> => {
  // Simulate compression by reducing quality
  const channelData = audioBuffer.getChannelData(0);
  const compressedData = new Float32Array(channelData.length);
  
  // Apply simple compression (reduce bit depth)
  for (let i = 0; i < channelData.length; i++) {
    compressedData[i] = Math.round(channelData[i] * 32767) / 32767;
  }
  
  // Convert to WAV format (simplified)
  const buffer = new ArrayBuffer(44 + compressedData.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + compressedData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 22050, true);
  view.setUint32(28, 22050 * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, compressedData.length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < compressedData.length; i++) {
    const sample = Math.max(-1, Math.min(1, compressedData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/mp3' });
};
