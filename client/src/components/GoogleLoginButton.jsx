import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

/** Injects the Google Identity Services script once and resolves when ready. */
const loadGsiScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()

    const existing = document.querySelector(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Could not reach accounts.google.com'))
      )
      return
    }

    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Could not reach accounts.google.com'))
    document.head.appendChild(script)
  })

// Renders Google's official "Sign in with Google" button. Google returns an
// ID token which the backend verifies before issuing our own JWT.
//
// GSI renders nothing and throws nothing when it rejects a config, so the
// container is watched and the likely cause reported.
const GoogleLoginButton = ({ onSuccess }) => {
  const { googleLogin } = useAppContext()
  const containerRef = useRef(null)
  const [error, setError] = useState('')

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // Keep the latest callback in a ref so GSI always calls the current version
  const handlerRef = useRef()
  handlerRef.current = async (response) => {
    const ok = await googleLogin(response.credential)
    if (ok) onSuccess?.()
  }

  useEffect(() => {
    if (!clientId) {
      setError(
        'VITE_GOOGLE_CLIENT_ID is missing from client/.env. Add it, then restart the dev server (Vite only reads .env at startup).'
      )
      return
    }

    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      setError(
        clientId.startsWith('GOCSPX-')
          ? 'VITE_GOOGLE_CLIENT_ID holds a client SECRET. Use the client ID ending in .apps.googleusercontent.com'
          : 'VITE_GOOGLE_CLIENT_ID is not a valid Google client ID'
      )
      return
    }

    // A page opened from disk has no authorisable origin
    if (window.location.protocol === 'file:') {
      setError(
        'This page is running from file://, which Google Sign-In cannot support. ' +
          'Serve the app over http (npm run dev) instead.'
      )
      return
    }

    let cancelled = false
    let timer

    loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) return

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handlerRef.current(response),
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: 320,
        })

        // GSI renders asynchronously; nothing appearing means a rejected config
        const startedAt = Date.now()
        const verifyRendered = () => {
          if (cancelled || !containerRef.current) return

          if (containerRef.current.childElementCount > 0) return

          if (Date.now() - startedAt > 4000) {
            setError(
              `Google refused to render the button. Add "${window.location.origin}" to ` +
                'Authorised JavaScript origins for this client ID in Google Cloud Console, ' +
                'then hard-refresh. (Check the console for [GSI_LOGGER] details.)'
            )
            return
          }

          timer = setTimeout(verifyRendered, 250)
        }
        verifyRendered()
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [clientId])

  return (
    <div className='flex flex-col items-center gap-2'>
      {/* Kept mounted at all times so GSI always has a target to render into */}
      <div ref={containerRef} className='flex justify-center min-h-[44px]' />

      {error && (
        <p className='text-xs text-center text-amber-400/90 leading-relaxed'>
          {error}
        </p>
      )}
    </div>
  )
}

export default GoogleLoginButton
