import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, StarIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import SmartImage from './SmartImage'
import BlurCircle from './BlurCircle'
import Reveal, { StaggerGroup, StaggerItem } from './motion/Reveal'

// Upcoming releases with no showtime scheduled yet. Not clickable, since
// there is nothing to book.
const ComingSoonSection = () => {
  const { axios, imageUrl } = useAppContext()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const { data } = await axios.get('/api/show/coming-soon')
        if (!cancelled && data.success) setMovies(data.movies.slice(0, 8))
      } catch (error) {
        console.error('coming-soon:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Nothing to show
  if (loading || movies.length === 0) return null

  return (
    <div className='relative px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <BlurCircle top='0' left='-80px' />

      <Reveal>
        <div className='flex items-center gap-2 mb-2'>
          <CalendarClock className='w-5 h-5 text-primary' />
          <p className='text-gray-300 font-medium text-lg'>Coming Soon</p>
        </div>
        <p className='text-gray-500 text-sm mb-8'>
          Releasing soon — booking opens closer to the date.
        </p>
      </Reveal>

      <StaggerGroup
        className='flex flex-wrap max-sm:justify-center gap-8'
        staggerChildren={0.1}
      >
        {movies.map((movie) => (
          <StaggerItem key={movie._id}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className='relative w-44 rounded-xl overflow-hidden bg-gray-800/60 border border-gray-700'
            >
              <div className='relative'>
                <SmartImage
                  candidates={movie.poster_candidates}
                  src={imageUrl(movie.poster_path)}
                  alt={movie.title}
                  className='h-60 w-full object-cover brightness-90'
                />
                <span className='absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/75 text-gray-200 px-2 py-1 rounded'>
                  Coming soon
                </span>
              </div>

              <div className='p-3'>
                <p className='font-medium truncate text-sm'>{movie.title}</p>
                <div className='flex items-center justify-between mt-1'>
                  <p className='text-xs text-gray-400'>{movie.year}</p>
                  {movie.vote_average > 0 && (
                    <p className='flex items-center gap-1 text-xs text-gray-400'>
                      <StarIcon className='w-3.5 h-3.5 text-primary fill-primary' />
                      {movie.vote_average.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerGroup>
    </div>
  )
}

export default ComingSoonSection
