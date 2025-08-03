import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [framePosition, setFramePosition] = useState<'first' | 'last'>('last')
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setExtractedImageUrl(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setExtractedImageUrl(null)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const extractFrame = async () => {
    if (!selectedFile || !videoRef.current || !canvasRef.current) return

    setIsProcessing(true)
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      setIsProcessing(false)
      return
    }

    video.src = URL.createObjectURL(selectedFile)
    
    return new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        if (framePosition === 'first') {
          video.currentTime = 0
        } else {
          video.currentTime = video.duration - 0.1
        }
        
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const imageUrl = URL.createObjectURL(blob)
              setExtractedImageUrl(imageUrl)
            }
            setIsProcessing(false)
            resolve()
          }, 'image/png')
        }
      }
    })
  }

  const downloadImage = () => {
    if (!extractedImageUrl) return
    
    const link = document.createElement('a')
    link.href = extractedImageUrl
    link.download = `${framePosition}-frame.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-icon">
          🎬
        </div>
        <h1>動画フレーム抽出ツール</h1>
        <p className="subtitle">お気に入りの瞬間を画像として保存しよう</p>
      </div>
      
      <div 
        className={`upload-section ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="file-input-hidden"
        />
        <div className="upload-content">
          {selectedFile ? (
            <div className="file-selected">
              <div className="file-icon">📹</div>
              <div className="file-info">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className="change-file">別のファイルを選択</div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>動画ファイルをドラッグ&ドロップ</strong>
                <span>またはクリックして選択</span>
              </div>
              <div className="upload-formats">対応形式: MP4, MOV, AVI, WebM</div>
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="controls">
          <div className="frame-selector">
            <h3>抽出するフレームを選択</h3>
            <div className="radio-group">
              <label className={`radio-option ${framePosition === 'first' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="first"
                  checked={framePosition === 'first'}
                  onChange={(e) => setFramePosition(e.target.value as 'first' | 'last')}
                />
                <div className="radio-custom"></div>
                <div className="radio-content">
                  <div className="radio-icon">⏮️</div>
                  <div className="radio-label">最初のフレーム</div>
                </div>
              </label>
              <label className={`radio-option ${framePosition === 'last' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="last"
                  checked={framePosition === 'last'}
                  onChange={(e) => setFramePosition(e.target.value as 'first' | 'last')}
                />
                <div className="radio-custom"></div>
                <div className="radio-content">
                  <div className="radio-icon">⏭️</div>
                  <div className="radio-label">最後のフレーム</div>
                </div>
              </label>
            </div>
          </div>
          
          <button
            onClick={extractFrame}
            disabled={isProcessing}
            className={`extract-button ${isProcessing ? 'processing' : ''}`}
          >
            <span className="button-icon">✨</span>
            <span className="button-text">
              {isProcessing ? '処理中...' : 'フレームを抽出'}
            </span>
            {isProcessing && <div className="loading-spinner"></div>}
          </button>
        </div>
      )}

      {extractedImageUrl && (
        <div className="result-section">
          <div className="result-card">
            <h3>抽出結果</h3>
            <div className="image-container">
              <img src={extractedImageUrl} alt="抽出されたフレーム" className="extracted-image" />
            </div>
            <button onClick={downloadImage} className="download-button">
              <span className="button-icon">💾</span>
              <span className="button-text">画像をダウンロード</span>
            </button>
          </div>
        </div>
      )}

      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default App
