'use client';

import { useState, useEffect } from 'react';

const SERVICES = [
  { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', icon: '🤖' },
  { id: 'canva', name: 'Canva', color: '#00d4aa', icon: '🎨' },
  { id: 'perplexity', name: 'Perplexity', color: '#20b8cd', icon: '🔍' },
  { id: 'netflix', name: 'Netflix', color: '#e50914', icon: '🎬' },
  { id: 'hotstar', name: 'JioHotstar', color: '#0a74da', icon: '📺' },
];

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [cookies, setCookies] = useState({});
  const [activeService, setActiveService] = useState('chatgpt');
  const [cookieInput, setCookieInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) setIsLoggedIn(true);
    loadCookies();
  }, []);

  const loadCookies = async () => {
    try {
      const res = await fetch('/api/cookies');
      const data = await res.json();
      setCookies(data.services || {});
    } catch (e) {
      console.error('Failed to load cookies');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        setMessage('');
      } else {
        setMessage('Invalid password');
      }
    } catch (e) {
      setMessage('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
  };

  const parseCookies = (text) => {
    // Parse Netscape cookie format
    const lines = text.trim().split('\n');
    const parsed = [];
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const parts = line.split('\t');
      if (parts.length >= 7) {
        parsed.push({
          name: parts[5],
          value: parts[6],
          domain: parts[0],
          path: parts[2],
          secure: parts[3].toLowerCase() === 'true',
          httpOnly: false,
          expirationDate: parseInt(parts[4]) || Math.floor(Date.now() / 1000) + 86400 * 365
        });
      }
    }
    return parsed;
  };

  const handleSave = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setMessage('Please login again');
      return;
    }

    setSaving(true);
    try {
      const parsedCookies = parseCookies(cookieInput);
      
      if (parsedCookies.length === 0) {
        setMessage('No valid cookies found. Use Netscape format.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/cookies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service: activeService,
          cookies: parsedCookies
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${activeService} cookies updated! (${parsedCookies.length} cookies)`);
        setCookieInput('');
        loadCookies();
      } else {
        setMessage('❌ Failed to save: ' + data.error);
      }
    } catch (e) {
      setMessage('❌ Error saving cookies');
    }
    setSaving(false);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>🔐 OTT Admin Panel</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.loginBtn}>Login</button>
          </form>
          {message && <p style={styles.error}>{message}</p>}
          <p style={styles.credit}>Developed by Sam Khan</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎬 OTT Cookie Manager</h1>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>

        <div style={styles.services}>
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => { setActiveService(service.id); setMessage(''); setCookieInput(''); }}
              style={{
                ...styles.serviceBtn,
                backgroundColor: activeService === service.id ? service.color : '#2a2a3e',
                borderColor: service.color,
              }}
            >
              <span style={styles.serviceIcon}>{service.icon}</span>
              <span>{service.name}</span>
              {cookies[service.id]?.cookies?.length > 0 && (
                <span style={styles.badge}>{cookies[service.id].cookies.length}</span>
              )}
            </button>
          ))}
        </div>

        <div style={styles.editor}>
          <h3 style={styles.editorTitle}>
            Update {SERVICES.find(s => s.id === activeService)?.name} Cookies
          </h3>
          
          <textarea
            placeholder="Paste Netscape format cookies here...

Example:
.example.com	TRUE	/	TRUE	1234567890	cookie_name	cookie_value"
            value={cookieInput}
            onChange={(e) => setCookieInput(e.target.value)}
            style={styles.textarea}
          />

          <div style={styles.actions}>
            <button 
              onClick={handleSave} 
              disabled={saving || !cookieInput.trim()}
              style={{
                ...styles.saveBtn,
                opacity: saving || !cookieInput.trim() ? 0.5 : 1
              }}
            >
              {saving ? 'Saving...' : '💾 Save Cookies'}
            </button>
          </div>

          {message && (
            <div style={{
              ...styles.message,
              backgroundColor: message.includes('✅') ? '#1a4d2e' : '#4d1a1a'
            }}>
              {message}
            </div>
          )}

          {cookies[activeService]?.cookies?.length > 0 && (
            <div style={styles.currentCookies}>
              <h4>Current Cookies ({cookies[activeService].cookies.length})</h4>
              <div style={styles.cookieList}>
                {cookies[activeService].cookies.map((c, i) => (
                  <div key={i} style={styles.cookieItem}>
                    <strong>{c.name}</strong>
                    <span style={styles.cookieDomain}>{c.domain}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <p>API Endpoint: <code style={styles.code}>/api/cookies</code></p>
          <p style={styles.credit}>Developed by Sam Khan | @IAMSAMKHANOFFICIAL</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '20px',
  },
  loginBox: {
    background: 'rgba(255,255,255,0.05)',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  loginTitle: {
    color: '#fff',
    marginBottom: '30px',
    fontSize: '28px',
  },
  input: {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    marginBottom: '15px',
    fontSize: '16px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
  },
  loginBtn: {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
  },
  error: {
    color: '#ff6b6b',
    marginTop: '15px',
  },
  panel: {
    width: '100%',
    maxWidth: '900px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    padding: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '24px',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: '#4a4a5e',
    color: '#fff',
    cursor: 'pointer',
  },
  services: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '30px',
  },
  serviceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '10px',
    border: '2px solid',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s',
    fontSize: '14px',
  },
  serviceIcon: {
    fontSize: '18px',
  },
  badge: {
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
  },
  editor: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '15px',
    padding: '25px',
  },
  editorTitle: {
    color: '#fff',
    marginTop: 0,
    marginBottom: '20px',
  },
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '15px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: '13px',
    fontFamily: 'monospace',
    resize: 'vertical',
  },
  actions: {
    marginTop: '20px',
  },
  saveBtn: {
    padding: '15px 30px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #10a37f, #0a8f6f)',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  message: {
    marginTop: '20px',
    padding: '15px',
    borderRadius: '10px',
    color: '#fff',
  },
  currentCookies: {
    marginTop: '30px',
    color: '#fff',
  },
  cookieList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '10px',
  },
  cookieItem: {
    background: 'rgba(255,255,255,0.1)',
    padding: '8px 15px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
  },
  cookieDomain: {
    color: '#888',
    fontSize: '11px',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
    color: '#666',
    fontSize: '13px',
  },
  code: {
    background: 'rgba(255,255,255,0.1)',
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#10a37f',
  },
  credit: {
    color: '#888',
    marginTop: '10px',
  },
};

