declare module 'ffmpeg-wasm-mkv' {
  interface StreamInfo {
    id: string
    lang: string
    formatDescription: string
  }
  interface LoadMediaResult {
    src: string
    videoStreams: StreamInfo[]
    audioStreams: StreamInfo[]
  }
  class Ffwm {
    constructor(
      coreURL: string,
      wasmURL: string,
      nuxjsURL?: string,
      bufferSizeSec?: number,
      bufferRefillSec?: number,
      workerURL?: string
    )
    loadedMediaMetadata?: { durationSeconds: number }
    loadMedia(file: File): Promise<LoadMediaResult>
    start(videoStreamId: string, audioStreamId: string | null): Promise<void>
    onTimeUpdate(time: number): Promise<void>
    clean(): void
  }
  export default Ffwm
}

declare module 'mux.js' {
  const muxjs: any
  export default muxjs
}

interface Window {
  muxjs: any
}
