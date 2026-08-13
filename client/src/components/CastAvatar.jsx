import { useState } from 'react'

const initials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')

// Shows a headshot when one is available, falling back to initials if the
// image is missing or fails to load.
const CastAvatar = ({ name, src, character }) => {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className='flex flex-col items-center text-center'>
      {showImage ? (
        <img
          src={src}
          alt={name}
          loading='lazy'
          onError={() => setFailed(true)}
          className='rounded-full h-20 w-20 aspect-square object-cover bg-gray-800'
        />
      ) : (
        <div className='rounded-full h-20 w-20 aspect-square flex items-center justify-center bg-gray-800 border border-gray-700 text-lg font-semibold uppercase'>
          {initials(name)}
        </div>
      )}

      <p className='font-medium text-xs mt-3 max-w-24 truncate'>{name}</p>
      {character && (
        <p className='text-[11px] text-gray-500 max-w-24 truncate'>{character}</p>
      )}
    </div>
  )
}

export default CastAvatar
