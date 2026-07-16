/* eslint-disable react-hooks/purity */
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCars } from '../lib/db'
import './AIAssistantPage.css'

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'ai',
    text: 'Hello! I\'m NoBroker AI — your personal car assistant. I can help you find the perfect car, evaluate prices, compare models, and guide you through the buying process. What are you looking for today?',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
]

const SUGGESTIONS = [
  'Find me an electric car under ₹50L',
  'Compare Tata Harrier vs Kia Seltos',
  'Is the Thar LX 4x4 fairly priced?',
  'Best SUV for family use in Mumbai',
  'Cars with best resale value in 2024',
]

const AI_RESPONSES = {
  electric: 'Great choice! I found 2 electric cars in our live database matching that range:\n\n🔋 **Porsche Taycan Turbo S** — ₹2,45,00,000 | Range: 450 KM\n🔋 **Tesla Model 3** — ₹60,00,000 | Range: 500 KM\n\nThe Tesla Model 3 offers the best price-to-range value. Would you like more details?',
  harrier: 'The Tata Harrier Dark Edition offers great value with its 170HP diesel engine, sunroof, and JBL audio. Our AI analysis shows it\'s priced 2% below market average for its mileage bracket. 👍',
  seltos: 'The Kia Seltos GT Line packs 140HP with a sport-tuned DCT. It has excellent safety ratings and a 7-year warranty. Compared to the Harrier, it\'s more fuel efficient for city driving.',
  thar: 'Based on comparable listings in India, the Mahindra Thar LX 4x4 at ₹16,50,000 is **4% below market average**. With only 15,200 KM driven and single ownership, this is an exceptional deal. 🚗💨',
  default: 'I can help you with that! Based on your query, I recommend exploring our curated inventory where you\'ll find verified listings with AI-backed price analysis. Would you like me to search the inventory for you?',
}

function getStaticAIResponse(message) {
  const lower = message.toLowerCase()
  if (lower.includes('electric') || lower.includes('ev')) return AI_RESPONSES.electric
  if (lower.includes('harrier')) return AI_RESPONSES.harrier
  if (lower.includes('seltos')) return AI_RESPONSES.seltos
  if (lower.includes('thar')) return AI_RESPONSES.thar
  return AI_RESPONSES.default
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nbc_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const allCars = await getCars()
      const lower = text.toLowerCase()

      // Look for matches in the live inventory
      const matches = allCars.filter(
        (c) =>
          c.status === 'active' &&
          (c.name.toLowerCase().includes(lower) ||
            c.make.toLowerCase().includes(lower) ||
            c.model.toLowerCase().includes(lower) ||
            c.fuelType.toLowerCase().includes(lower) ||
            (lower.includes('electric') && c.fuelType.toLowerCase() === 'electric') ||
            (lower.includes('ev') && c.fuelType.toLowerCase() === 'electric') ||
            (lower.includes('diesel') && c.fuelType.toLowerCase() === 'diesel') ||
            (lower.includes('petrol') && c.fuelType.toLowerCase() === 'petrol') ||
            c.location.toLowerCase().includes(lower))
      )

      let responseText = ''

      if (apiKey) {
        try {
          const activeCarsList = allCars
            .filter(c => c.status === 'active')
            .map(c => `- ${c.year} ${c.make} ${c.model} (${c.fuelType}, ${c.transmission}): ₹${(c.price / 100000).toFixed(1)}L, Location: ${c.location}, ID: ${c.id}`)
            .join('\n')

          const systemPrompt = `You are "NoBroker AI", an advanced car search assistant for NoBrokerCars.
Your goal is to help users find the best cars from our live inventory, compare models, and give helpful insights.

Here is our live car inventory:
${activeCarsList}

Guidelines:
1. Always suggest and recommend cars from the live inventory above. When mentioning a car from the inventory, link to it like this: [2023 Toyota Fortuner](/car/toyota-fortuner-legender-2023) using their ID, so the user can click it.
2. If a customer asks a general car question (e.g. "What is the difference between CVT and AMT?" or "Suggest a good family car" or "Which fuel type is best?"), answer it dynamically, accurately, and helpful.
3. Be professional, friendly, and brief (no more than 3-4 sentences per response). Do not make up cars that are not in the list; if you suggest a car not in our list, clarify that we don't have it in stock currently but show what similar options we do have.`

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: text }]
                  }
                ],
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                }
              })
            }
          )

          if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`)
          }

          const resData = await response.json()
          responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text || 'I am sorry, I could not process that request.'
        } catch (apiErr) {
          console.error('Gemini API Error, falling back to static matching:', apiErr)
          // Fallback to static matches if API fails
          if (matches.length > 0) {
            responseText = `I found **${matches.length} matching car(s)** in our live inventory:\n\n` + 
              matches.map(c => `🚗 **[${c.year} ${c.name}](/car/${c.id})** — ${c.priceDisplay} | Location: ${c.location} | Driven: ${c.mileage}`).join('\n\n') +
              `\n\nWould you like me to help you schedule a test drive or contact the seller?`
          } else {
            responseText = getStaticAIResponse(text)
          }
        }
      } else {
        // Fallback to static matches if no API key set
        if (matches.length > 0) {
          responseText = `I found **${matches.length} matching car(s)** in our live inventory:\n\n` + 
            matches.map(c => `🚗 **[${c.year} ${c.name}](/car/${c.id})** — ${c.priceDisplay} | Location: ${c.location} | Driven: ${c.mileage}`).join('\n\n') +
            `\n\nWould you like me to help you schedule a test drive or contact the seller?`
        } else {
          responseText = getStaticAIResponse(text)
        }
      }

      setTimeout(() => {
        const aiMsg = {
          id: Date.now() + 1,
          role: 'ai',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages((prev) => [...prev, aiMsg])
        setIsTyping(false)
      }, 1000)

    } catch (err) {
      console.error('Error in AI assistant query:', err)
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) sendMessage(input.trim())
  }

  // Intercept click on bubble link so it navigates using React Router
  const handleBubbleClick = (e) => {
    const targetLink = e.target.closest('a')
    if (targetLink) {
      const href = targetLink.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        navigate(href)
      }
    }
  }

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div className="container ai-header-inner">
          <div className="ai-avatar-large">
            <span>🤖</span>
          </div>
          <div>
            <p className="label-m">AI-Powered</p>
            <h1 className="headline-m" style={{ marginTop: '0.25rem' }}>NoBroker AI Assistant</h1>
            <p className="body-m" style={{ marginTop: '0.25rem' }}>Real-time price analysis · Model comparisons · Buying guidance</p>
          </div>
          <div className="ai-status">
            <span className="ai-status-dot" />
            <span className="label-s" style={{ color: '#64dc82' }}>Online</span>
          </div>
        </div>
      </div>

      {/* API Key Connection Bar */}
      <div className="ai-api-bar glass" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-container-low)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="body-m" style={{ color: apiKey ? 'var(--secondary)' : 'var(--text-secondary)' }}>
            {apiKey ? '🟢 Live AI Mode Connected (Gemini 2.5 Flash)' : '🟡 Demo Mode (Connected to pre-loaded responses)'}
          </span>
          <button className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }} onClick={() => setShowKeyInput(!showKeyInput)}>
            {showKeyInput ? 'Hide Settings' : 'Configure Live AI ⚙️'}
          </button>
        </div>
        
        {showKeyInput && (
          <div className="container" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'var(--surface-container-lowest)' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <label className="label-s" style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 600 }}>Google Gemini API Key</label>
              <input
                type="password"
                placeholder="Paste your Gemini API Key here (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-container-high)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button className="btn-primary" onClick={() => {
                if (apiKey.trim()) {
                  localStorage.setItem('nbc_gemini_api_key', apiKey.trim());
                  setShowKeyInput(false);
                  alert('Gemini API Key saved successfully! The AI will now answer any custom customer questions.');
                }
              }}>Save Key</button>
              <button className="btn-ghost" style={{ color: '#ff6b6b' }} onClick={() => {
                localStorage.removeItem('nbc_gemini_api_key');
                setApiKey('');
                setShowKeyInput(false);
                alert('API Key cleared. Reverted to pre-loaded demo answers.');
              }}>Reset</button>
              <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ alignSelf: 'center', fontSize: '0.875rem', color: 'var(--secondary)', textDecoration: 'underline', marginLeft: '0.5rem' }}>Get Free Key ↗</a>
            </div>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="container ai-chat-container">
        <div className="ai-messages" id="ai-messages-list">
          {messages.map((msg) => (
            <div key={msg.id} className={`msg msg--${msg.role}`}>
              {msg.role === 'ai' && (
                <div className="msg-avatar">🤖</div>
              )}
              <div className="msg-bubble" onClick={handleBubbleClick}>
                {msg.text.split('\n').map((line, i) => {
                  const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--secondary); text-decoration: underline; font-weight: bold;">$1</a>')
                  return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ margin: 0, minHeight: '1.25rem' }} />
                })}
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="msg msg--ai">
              <div className="msg-avatar">🤖</div>
              <div className="msg-bubble typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="ai-suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="chip ai-suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
          ))}
        </div>

        {/* Input */}
        <form className="ai-input-form glass" onSubmit={handleSubmit} id="ai-chat-form">
          <input
            id="ai-chat-input"
            type="text"
            placeholder="Ask anything about cars…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="ai-input"
          />
          <button type="submit" className="btn-primary ai-send-btn" disabled={!input.trim()}>
            Send →
          </button>
        </form>
      </div>
    </div>
  )
}
