import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import BlurCircle from '../components/BlurCircle'

const Login = () => {
  const { login, register, googleLogin } = useAppContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Google Sign-In script and initialize
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const success = await googleLogin(response.credential);
            if (success) {
              navigate('/');
            }
          },
        });

        // Render the Google Sign-In button
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', width: '100%' }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleLogin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success =
      mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);

    setLoading(false);

    if (success) {
      navigate('/');
    }
  };

  return (
    <div className='relative min-h-screen flex items-center justify-center px-6'>
      <BlurCircle top='0px' left='0px' />
      <BlurCircle bottom='0px' right='0px' />

      <form
        onSubmit={handleSubmit}
        className='relative w-full max-w-sm bg-primary/5 border border-primary/20 rounded-xl p-8 flex flex-col gap-4'
      >
        <h1 className='text-2xl font-semibold text-center mb-2'>
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>

        {mode === 'register' && (
          <input
            type='text'
            required
            placeholder='Full name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            className='px-4 py-2 rounded-md bg-black/30 border border-gray-600 outline-none focus:border-primary'
          />
        )}

        <input
          type='email'
          required
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='px-4 py-2 rounded-md bg-black/30 border border-gray-600 outline-none focus:border-primary'
        />

        <input
          type='password'
          required
          minLength={6}
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className='px-4 py-2 rounded-md bg-black/30 border border-gray-600 outline-none focus:border-primary'
        />

        <button
          type='submit'
          disabled={loading}
          className='mt-2 bg-primary hover:bg-primary-dull transition rounded-full py-2 font-medium cursor-pointer disabled:opacity-50'
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}
        </button>

        <div className='relative my-4'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-600'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-2 bg-primary/5 text-gray-400'>Or continue with</span>
          </div>
        </div>

        <div id='google-signin-button' className='flex justify-center'></div>

        <p className='text-sm text-center text-gray-400'>
          {mode === 'login'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type='button'
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className='text-primary cursor-pointer'
          >
            {mode === 'login' ? 'Sign up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  )
}

export default Login
