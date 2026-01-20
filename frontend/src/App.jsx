import { useState, useCallback, useEffect } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking')

  const checkBackend = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      
      const res = await fetch('http://localhost:8000/', {
        method: 'GET',
        signal: controller.signal
      })
      clearTimeout(timeout)
      
      if (res.ok) {
        setBackendStatus('connected')
        setError('')
        return true
      }
    } catch {
      setBackendStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    checkBackend()
    const interval = setInterval(checkBackend, 3000)
    return () => clearInterval(interval)
  }, [checkBackend])

  const analyzeCall = useCallback(async () => {
    if (!file || backendStatus !== 'connected') return
    
    setLoading(true)
    setError('')
    setAnalysis(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/analyze-call', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      console.log('✅ Backend data:', data)
      
      // 🔥 FIXED: Proper array joining for display
      setAnalysis({
        transcript: data.transcript || 'No transcript',
        timestamp: data.timestamp || '',
        filename: data.filename || 'Unknown',
        filesize: data.filesize || 0,
        overall_score: data.executive_summary?.overall_score || 6.5,
        what_went_well: Array.isArray(data.executive_summary?.what_went_well)
          ? data.executive_summary.what_went_well.join('\n')
          : typeof data.executive_summary?.what_went_well === 'string'
          ? data.executive_summary.what_went_well
          : 'Good analysis complete',
        improvements: Array.isArray(data.executive_summary?.improvements)
          ? data.executive_summary.improvements.join('\n')
          : typeof data.executive_summary?.improvements === 'string'
          ? data.executive_summary.improvements
          : 'No issues detected',
        missed_opportunities: Array.isArray(data.executive_summary?.missed_opportunities)
          ? data.executive_summary.missed_opportunities.join('\n')
          : typeof data.executive_summary?.missed_opportunities === 'string'
          ? data.executive_summary.missed_opportunities
          : 'None identified',
        next_actions: Array.isArray(data.executive_summary?.recommended_actions)
          ? data.executive_summary.recommended_actions.join('\n')
          : typeof data.executive_summary?.recommended_actions === 'string'
          ? data.executive_summary.recommended_actions
          : 'Follow up recommended'
      })
      
    } catch (err) {
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [file, backendStatus])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type.startsWith('audio/')) {
      setFile(selectedFile)
      setAnalysis(null)
      setError('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-8 drop-shadow-2xl">
            🎙️ AI Sales Call Coach
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            3 LangGraph AI Agents → Real-time sales call analysis
          </p>
          
          <div className={`mt-8 px-8 py-4 rounded-2xl text-lg font-bold mx-auto max-w-max flex items-center gap-3 ${
            backendStatus === 'connected' 
              ? 'bg-emerald-500/30 text-emerald-200 border-2 border-emerald-500/50 shadow-lg' 
              : 'bg-red-500/30 text-red-200 border-2 border-red-500/50 shadow-lg'
          }`}>
            🔌 Backend: {backendStatus === 'connected' ? '✅ Connected (3 Agents Active)' : '❌ Offline'}
          </div>
        </div>

        {/* Upload */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-12 mb-16 border border-white/20 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <label className="block w-full px-12 py-16 border-4 border-dashed border-gray-500/50 rounded-3xl 
                cursor-pointer group hover:border-emerald-400 hover:bg-white/10 transition-all">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-center">
                  <div className="text-7xl mb-8 group-hover:scale-110 transition-transform">📞</div>
                  <p className="text-3xl font-bold mb-4">
                    {file ? file.name : 'Upload sales call audio'}
                  </p>
                  <p className="text-xl text-gray-400">MP3, WAV, M4A • 3 AI agents analyze instantly</p>
                  {file && (
                    <p className="mt-4 text-emerald-400 font-bold bg-emerald-500/20 px-6 py-3 rounded-2xl border border-emerald-500/30">
                      ✅ {(file.size/1024/1024).toFixed(1)}MB - Ready
                    </p>
                  )}
                </div>
              </label>
            </div>
            
            <div className="flex-1 text-center">
              <button
                onClick={analyzeCall}
                disabled={!file || loading || backendStatus !== 'connected'}
                className="px-16 py-10 bg-gradient-to-r from-emerald-600 to-blue-600 text-2xl font-black 
                  rounded-3xl shadow-2xl hover:shadow-3xl hover:from-emerald-700 hover:to-blue-700 
                  transform hover:scale-105 transition-all disabled:opacity-50 h-[100px] min-w-[300px]"
              >
                {loading ? (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    3 Agents Analyzing...
                  </div>
                ) : (
                  '🚀 Analyze Sales Call'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-8">
            {/* Score Card */}
            <div className="bg-gradient-to-r from-emerald-500/30 to-blue-500/30 backdrop-blur-xl border-2 
              border-emerald-400/50 rounded-3xl p-10 text-center shadow-2xl">
              <h2 className="text-4xl font-black text-white mb-6">🎯 Analysis Complete</h2>
              <div className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-4">
                {analysis.overall_score}/10
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-white/80 mt-4">
                <div>📄 {analysis.filename}</div>
                <div>{(analysis.filesize/1024).toFixed(0)}KB</div>
                <div>3 LangGraph Agents</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* 🔥 FIXED Transcript Display */}
              <div className="bg-gradient-to-b from-slate-800/50 to-black/30 backdrop-blur-xl rounded-3xl 
                p-10 border border-white/20 shadow-2xl">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-white">
                  📄 Full Transcript
                </h2>
                <div className="max-h-96 overflow-auto bg-black/50 p-8 rounded-2xl font-mono text-sm 
                  text-white/95 border border-white/20 leading-6 whitespace-pre-wrap">
                  {analysis.transcript}
                </div>
              </div>

              {/* Agent Results */}
              <div className="space-y-6">
                <div className="bg-emerald-500/20 border-l-8 border-emerald-500 p-8 rounded-2xl backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-emerald-100 mb-4 flex items-center gap-3">
                    ✅ What Went Well
                  </h3>
                  <div className="text-emerald-50 text-lg leading-relaxed whitespace-pre-line">
                    {analysis.what_went_well}
                  </div>
                </div>

                <div className="bg-amber-500/20 border-l-8 border-amber-500 p-8 rounded-2xl backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-amber-100 mb-4 flex items-center gap-3">
                    ⚠️ Improvements
                  </h3>
                  <div className="text-amber-50 text-lg leading-relaxed whitespace-pre-line">
                    {analysis.improvements}
                  </div>
                </div>

                <div className="bg-red-500/20 border-l-8 border-red-500 p-8 rounded-2xl backdrop-blur-xl">
                  <h3 className="text-2xl font-bold text-red-100 mb-4 flex items-center gap-3">
                    🚨 Missed Opportunities
                  </h3>
                  <div className="text-red-50 text-lg leading-relaxed whitespace-pre-line">
                    {analysis.missed_opportunities}
                  </div>
                </div>
              </div>
            </div>

            {analysis.next_actions && (
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-3xl p-10 backdrop-blur-xl text-center">
                <h3 className="text-3xl font-bold text-blue-100 mb-8 flex items-center gap-4 justify-center">
                  🎯 Next Actions
                </h3>
                <div className="text-xl text-blue-50 leading-relaxed whitespace-pre-line max-w-4xl mx-auto">
                  {analysis.next_actions}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto p-12 bg-red-500/20 border-2 border-red-500 rounded-3xl backdrop-blur-xl">
            <div className="text-2xl font-bold text-red-200 mb-4">⚠️ Error</div>
            <pre className="text-red-100 font-mono text-lg">{error}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
