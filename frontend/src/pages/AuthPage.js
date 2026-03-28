import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const [loginData, setLoginData] = useState({ emailOrUsername: '', password: '' });
  const [signupData, setSignupData] = useState({
    fullName: '', username: '', email: '', password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.emailOrUsername || !loginData.password) {
      return toast.error('Please fill all fields');
    }
    setLoading(true);
    try {
      await login(loginData);
      toast.success('Welcome back! 👋');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { fullName, username, email, password } = signupData;
    if (!fullName || !username || !email || !password) {
      return toast.error('Please fill all fields');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (username.length < 3) {
      return toast.error('Username must be at least 3 characters');
    }
    setLoading(true);
    try {
      await signup(signupData);
      toast.success('Account created! Welcome! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        {/* Left Panel - Branding */}
        <div className="auth-branding">
          <div className="brand-logo">✦</div>
          <h1 className="brand-name">Vibe</h1>
          <p className="brand-tagline">Share moments. Connect souls. Discover worlds.</p>
          <div className="brand-features">
            {['Share your story', 'Connect with friends', 'Discover amazing content', 'Build your community'].map((f, i) => (
              <div key={i} className="brand-feature" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="brand-mockup">
            <div className="mockup-card">
              <div className="mockup-header">
                <div className="mockup-avatar" />
                <div>
                  <div className="mockup-line short" />
                  <div className="mockup-line shorter" />
                </div>
              </div>
              <div className="mockup-image" />
              <div className="mockup-actions">
                <div className="mockup-action-btn" />
                <div className="mockup-action-btn" />
              </div>
              <div className="mockup-line" style={{ margin: '8px 12px' }} />
            </div>
          </div>
        </div>

        {/* Right Panel - Forms */}
        <div className="auth-forms">
          <div className="auth-card">
            <div className="auth-tabs">
              <button
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >Sign In</button>
              <button
                className={`auth-tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >Create Account</button>
              <div className="tab-indicator" style={{ transform: `translateX(${isLogin ? '0' : '100%'})` }} />
            </div>

            {isLogin ? (
              <form className="auth-form" onSubmit={handleLogin} key="login">
                <div className="form-welcome">
                  <h2>Welcome back</h2>
                  <p>Sign in to continue your journey</p>
                </div>

                <div className="form-group">
                  <label>Email or Username</label>
                  <div className="input-wrapper">
                    <span className="input-icon">@</span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Enter your email or username"
                      value={loginData.emailOrUsername}
                      onChange={e => setLoginData({ ...loginData, emailOrUsername: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In'}
                </button>

                <p className="auth-switch">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setIsLogin(false)}>Sign up free</button>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignup} key="signup">
                <div className="form-welcome">
                  <h2>Join Vibe</h2>
                  <p>Create your account and start sharing</p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Your full name"
                        value={signupData.fullName}
                        onChange={e => setSignupData({ ...signupData, fullName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <span className="input-icon">@</span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Choose username"
                        value={signupData.username}
                        onChange={e => setSignupData({ ...signupData, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="your@email.com"
                      value={signupData.email}
                      onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type="password"
                      className="auth-input"
                      placeholder="Min 6 characters"
                      value={signupData.password}
                      onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                    />
                  </div>
                  <div className="password-strength">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`strength-bar ${signupData.password.length >= i * 2 ? 'active' : ''}`}
                        style={{ background: signupData.password.length >= 8 ? 'var(--green)' : signupData.password.length >= 4 ? '#fbbf24' : 'var(--accent)' }}
                      />
                    ))}
                    <span>{signupData.password.length >= 8 ? 'Strong' : signupData.password.length >= 4 ? 'Medium' : signupData.password.length > 0 ? 'Weak' : ''}</span>
                  </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : 'Create Account'}
                </button>

                <p className="auth-terms">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>

                <p className="auth-switch">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setIsLogin(true)}>Sign in</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;