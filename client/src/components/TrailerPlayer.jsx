import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import { PlayCircleIcon } from 'lucide-react'
import { EASE } from './motion/Reveal'

// Kept outside any transformed element: Chrome re-composites iframes whose
// ancestors carry a transform, which interrupts playback.
const Frame = memo(function Frame({ videoId, title }) {
  return (
    <iframe
      src={
        `https://www.youtube.com/embed/${videoId}` +
        `?autoplay=1&rel=0&modestbranding=1&playsinline=1&vq=hd1080&hd=1`
      }
      title={`${title} trailer`}
      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
      allowFullScreen
      loading='eager'
      className='absolute inset-0 w-full h-full border-0'
    />
  )
})

// Loads the player only on click.
const TrailerPlayer = ({ videoId, title = '' }) => {
  const [playing, setPlaying] = useState(false)

  if (!videoId) return null

  return (
    <section className='mt-16 px-4 md:px-10'>
      <div className='max-w-4xl mx-auto'>
        <p className='text-lg font-medium mb-4'>Trailer</p>
      </div>

      {playing ? (
        <div className='relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10'>
          <Frame videoId={videoId} title={title} />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE }}
          className='relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10'
        >
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Play ${title} trailer`}
            className='group absolute inset-0 w-full h-full cursor-pointer'
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt={`${title} trailer thumbnail`}
              onError={(e) => {
                e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
              }}
              className='w-full h-full object-cover brightness-75 group-hover:brightness-90 transition'
            />
            <span className='absolute inset-0 flex items-center justify-center'>
              <PlayCircleIcon
                strokeWidth={1.4}
                className='w-16 h-16 md:w-24 md:h-24 text-white drop-shadow-lg group-hover:scale-110 transition-transform'
              />
            </span>
          </button>
        </motion.div>
      )}
    </section>
  )
}

export default TrailerPlayer
