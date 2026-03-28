import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, Mic, MicOff, Volume2, Hash, Download, FileText, Smile } from 'lucide-react'
import { CHANNELS, supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useMessages } from '../lib/hooks'
import { format, isToday, isYesterday } from 'date-fns'

const EMOJIS = ['👍','❤️','🔥','✅','😂','🎉','💡','🚀','⚡','🙌']

function FilePreview({ url, name, type, isVoice }) {
  if (isVoice) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(108,99,255,0.1)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 8,
        padding: '8px 12px',
        marginTop: 6,
        maxWidth: 260,
      }}>
        <Volume2 size={14} color="var(--purple)" />
        <audio src={url} controls style={{ height: 28, maxWidth: 200, filter: 'invert(0.8) hue-rotate(220deg)' }} />
      </div>
    )
  }

  if (type?.startsWith('image/')) {
    return (
      <div style={{ marginTop: 6 }}>
        <img
          src={url}
          alt={name}
          style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: '1px solid var(--border-2)', cursor: 'pointer', objectFit: 'cover' }}
          onClick={() => window.open(url, '_blank')}
        />
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        padding: '6px 10px',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border-2)',
        borderRadius: 8,
        fontSize: 12,
        color: 'var(--text)',
        textDecoration: 'none',
        maxWidth: 220,
      }}
    >
      <FileText size={13} color="var(--purple)" />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <Download size={12} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
    </a>
  )
}

function Message({ msg, prevMsg, getProfile }) {
  const member = getProfile(msg.user_id)
  const ts = new Date(msg.created_at)
  const prevMember = prevMsg ? getProfile(prevMsg.user_id) : null
  const isGrouped = prevMsg && prevMember?.id === member.id &&
    (ts - new Date(prevMsg.created_at)) < 5 * 60 * 1000

  function formatTime(date) {
    return format(date, 'h:mm a')
  }

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: isGrouped ? '2px 0' : '8px 0 2px',
      marginTop: isGrouped ? 0 : 4,
    }}>
      {!isGrouped ? (
        <div className="avatar" style={{ background: member.avatar_color || '#6c63ff', width: 36, height: 36, fontSize: 12, marginTop: 2, flexShrink: 0 }}>
          {member.initials}
        </div>
      ) : (
        <div style={{ width: 36, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!isGrouped && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: member.avatar_color || '#6c63ff' }}>{member.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'DM Mono' }}>{formatTime(ts)}</span>
          </div>
        )}
        {msg.content && (
          <p style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--text)',
            wordBreak: 'break-word',
          }}>
            {msg.content}
          </p>
        )}
        {msg.file_url && (
          <FilePreview url={msg.file_url} name={msg.file_name} type={msg.file_type} isVoice={msg.is_voice} />
        )}
      </div>
    </div>
  )
}

function DateDivider({ date }) {
  const d = new Date(date)
  const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      margin: '16px 0 8px',
      color: 'var(--text-dim)',
      fontSize: 12,
      fontFamily: 'DM Mono',
    }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'var(--border-2)' }} />
    </div>
  )
}

export default function TeamChat({ currentUser }) {
  const { getProfile } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')
  const { messages, loading, sendMessage } = useMessages(activeChannel)
  const [input, setInput]       = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [showEmoji, setShowEmoji]     = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef   = useRef(null)
  const mediaRecorder  = useRef(null)
  const audioChunks    = useRef([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const uploadFile = useCallback(async (file, isVoice = false) => {
    setUploading(true)
    try {
      const ext = file.name?.split('.').pop() || 'bin'
      const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('teamhub-files')
        .upload(path, file, { contentType: file.type })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('teamhub-files').getPublicUrl(path)

      await sendMessage({
        channel_id: activeChannel,
        user_id: currentUser,
        file_url: publicUrl,
        file_name: file.name || (isVoice ? 'Voice memo' : 'file'),
        file_type: file.type,
        is_voice: isVoice,
      })
    } catch (err) {
      console.error('Upload error:', err)
      // Fallback: show as local object URL if storage not configured
      const url = URL.createObjectURL(file)
      await sendMessage({
        channel_id: activeChannel,
        user_id: currentUser,
        file_url: url,
        file_name: file.name || (isVoice ? 'Voice memo' : 'file'),
        file_type: file.type,
        is_voice: isVoice,
      })
    } finally {
      setUploading(false)
    }
  }, [activeChannel, currentUser, sendMessage])

  async function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    await sendMessage({ channel_id: activeChannel, user_id: currentUser, content: text })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) await uploadFile(file)
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files)
    for (const file of files) await uploadFile(file)
    e.target.value = ''
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorder.current?.stop()
      setIsRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunks.current = []
      recorder.ondataavailable = e => audioChunks.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        await uploadFile(file, true)
      }
      mediaRecorder.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      alert('Microphone access denied.')
    }
  }

  // Group messages by date
  const groupedMessages = []
  let lastDate = null
  messages.forEach((msg, i) => {
    const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd')
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'divider', date: msg.created_at, key: `d-${i}` })
      lastDate = msgDate
    }
    groupedMessages.push({ type: 'message', msg, prev: messages[i - 1], key: msg.id })
  })

  const activeChannelInfo = CHANNELS.find(c => c.id === activeChannel)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Channels sidebar */}
      <div style={{
        width: 220,
        minWidth: 220,
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border-2)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
      }}>
        <p style={{
          fontSize: 11,
          color: 'var(--text-dim)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 16px',
          marginBottom: 8,
        }}>
          Channels
        </p>
        {CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: activeChannel === ch.id ? 'var(--purple-dim)' : 'transparent',
              color: activeChannel === ch.id ? 'var(--purple)' : 'var(--text-muted)',
              fontWeight: activeChannel === ch.id ? 700 : 400,
              fontSize: 14,
              border: 'none',
              textAlign: 'left',
              width: '100%',
              cursor: 'pointer',
              borderRight: activeChannel === ch.id ? '2px solid var(--purple)' : '2px solid transparent',
            }}
            onMouseEnter={e => { if (activeChannel !== ch.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
            onMouseLeave={e => { if (activeChannel !== ch.id) e.currentTarget.style.background = 'transparent' }}
          >
            <Hash size={14} />
            {ch.name}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: isDragOver ? 'rgba(108,99,255,0.04)' : 'transparent',
          border: isDragOver ? '2px dashed rgba(108,99,255,0.5)' : '2px solid transparent',
          transition: 'all 0.15s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{
              background: 'var(--bg-panel)',
              border: '2px dashed var(--purple)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 48px',
              textAlign: 'center',
            }}>
              <Paperclip size={32} color="var(--purple)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, fontSize: 16 }}>Drop files to upload</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Images, documents, any file</p>
            </div>
          </div>
        )}

        {/* Channel header */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          background: 'var(--bg-panel)',
        }}>
          <Hash size={16} color="var(--purple)" />
          <span style={{ fontWeight: 700 }}>{activeChannelInfo?.name}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>—</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeChannelInfo?.description}</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 40 }}>Loading…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 60 }}>
              <Hash size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>#{activeChannelInfo?.name}</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Start the conversation!</p>
            </div>
          ) : (
            groupedMessages.map(item =>
              item.type === 'divider'
                ? <DateDivider key={item.key} date={item.date} />
                : <Message key={item.key} msg={item.msg} prevMsg={item.prev} getProfile={getProfile} />
            )
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-2)',
          background: 'var(--bg-panel)',
          flexShrink: 0,
        }}>
          {uploading && (
            <div style={{ fontSize: 12, color: 'var(--purple)', marginBottom: 8, fontFamily: 'DM Mono', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Uploading file…
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px 12px',
            transition: 'border-color 0.15s',
          }}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {/* File attach */}
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ color: 'var(--text-muted)', background: 'none', padding: 4, flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--purple)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {/* Emoji */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowEmoji(v => !v)}
                style={{ color: 'var(--text-muted)', background: 'none', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--yellow)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Emoji"
              >
                <Smile size={18} />
              </button>
              {showEmoji && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: 8,
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 10,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                  width: 200,
                  boxShadow: 'var(--shadow)',
                  zIndex: 10,
                }} className="fade-in">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      onClick={() => { setInput(prev => prev + e); setShowEmoji(false) }}
                      style={{ fontSize: 20, background: 'none', padding: 2, borderRadius: 4, lineHeight: 1 }}
                      onMouseEnter={ev => ev.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={ev => ev.currentTarget.style.background = 'none'}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text input */}
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${activeChannelInfo?.name}`}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                resize: 'none',
                fontSize: 14,
                lineHeight: 1.5,
                minHeight: 22,
                maxHeight: 120,
                padding: 0,
                boxShadow: 'none',
                outline: 'none',
                color: 'var(--text)',
              }}
              rows={1}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />

            {/* Voice memo */}
            <button
              onClick={toggleRecording}
              style={{
                color: isRecording ? 'var(--pink)' : 'var(--text-muted)',
                background: isRecording ? 'rgba(255,101,132,0.1)' : 'none',
                padding: 4,
                borderRadius: 6,
                flexShrink: 0,
                animation: isRecording ? 'pulse 1s infinite' : 'none',
              }}
              title={isRecording ? 'Stop recording' : 'Record voice memo'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? 'var(--purple)' : 'var(--bg-hover)',
                color: input.trim() ? '#fff' : 'var(--text-dim)',
                padding: '6px 10px',
                borderRadius: 8,
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <Send size={15} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontFamily: 'DM Mono' }}>
            Enter to send · Shift+Enter for newline · Drag files to upload
          </p>
        </div>
      </div>
    </div>
  )
}
