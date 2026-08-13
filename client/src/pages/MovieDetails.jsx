import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ChevronDown, Heart, StarIcon, TicketIcon } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import SmartImage from '../components/SmartImage'
import TrailerPlayer from '../components/TrailerPlayer'
import Reveal, { StaggerGroup, StaggerItem, EASE } from '../components/motion/Reveal'
import toast from 'react-hot-toast'

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [show, setShow] = useState(null)
  const heroRef = useRef(null)

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    imageUrl,
  } = useAppContext()

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  })

  // Section is 260vh, so the poster stays pinned until progress 0.62.
  // The synopsis is fully in by 0.36, leaving a long hold where it sits
  // complete on the poster before the page releases into the trailer.
  const posterScale = useTransform(smooth, [0, 0.62], [1.05, 1.18])
  const posterY = useTransform(smooth, [0, 0.62], [0, 60])

  const titleOpacity = useTransform(smooth, [0, 0.14], [1, 0])
  const titleY = useTransform(smooth, [0, 0.25], [0, -70])
  const cueOpacity = useTransform(smooth, [0, 0.05], [1, 0])

  // Poster darkens as the synopsis fades in over it
  const scrimOpacity = useTransform(smooth, [0.06, 0.3], [0, 0.72])
  const synopsisOpacity = useTransform(smooth, [0.12, 0.3], [0, 1])
  const synopsisY = useTransform(smooth, [0.12, 0.36], [60, 0])

  // An element at opacity 0 still swallows clicks, so hand interactivity to
  // whichever layer is actually visible.
  const titlePointer = useTransform(smooth, (v) => (v < 0.14 ? 'auto' : 'none'))
  const synopsisPointer = useTransform(smooth, (v) => (v > 0.2 ? 'auto' : 'none'))

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) setShow(data)
    } catch (error) {
      console.log(error)
    }
  }

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error('Please login to proceed')

      const { data } = await axios.post(
        '/api/user/update-favorite',
        { movieId: id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      )

      if (data.success) {
        await fetchFavoriteMovies()
        toast.success(data.message)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getShow()
    scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!show) return <Loading />

  const movie = show.movie
  const year = String(movie.release_date || '').match(/\d{4}/)?.[0] || ''
  const isFavorite = favoriteMovies.some((m) => m._id === id)

  return (
    <div>
      {/* ---------- Pinned poster: title fades out, synopsis fades in ---------- */}
      <section ref={heroRef} className='relative h-[260vh]'>
        <div className='sticky top-0 h-screen overflow-hidden'>
          <motion.div
            style={{ scale: posterScale, y: posterY }}
            className='absolute inset-0 will-change-transform'
          >
            <SmartImage
              candidates={
                movie.backdrop_candidates?.length
                  ? movie.backdrop_candidates
                  : movie.poster_candidates
              }
              src={imageUrl(movie.backdrop_path || movie.poster_path)}
              alt={movie.title}
              width={1920}
              className='w-full h-full object-cover'
            />
          </motion.div>

          <div className='absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent' />
          <div className='absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent' />

          {/* Darkens as you scroll, making room for the synopsis */}
          <motion.div
            style={{ opacity: scrimOpacity }}
            className='absolute inset-0 bg-black pointer-events-none'
          />

          {/* Title block - fades out first */}
          <motion.div
            style={{ y: titleY, opacity: titleOpacity, pointerEvents: titlePointer }}
            className='absolute inset-0 z-10 flex flex-col justify-end pb-24 px-6 md:px-16 lg:px-40'
          >
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              className='text-primary font-medium tracking-widest uppercase text-sm'
            >
              {movie.original_language || 'Now Showing'}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
              className='text-4xl md:text-6xl lg:text-7xl font-bold text-white mt-3 max-w-4xl leading-tight'
            >
              {movie.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className='flex flex-wrap items-center gap-4 mt-5 text-gray-300'
            >
              {movie.vote_average > 0 && (
                <span className='flex items-center gap-1.5'>
                  <StarIcon className='w-5 h-5 text-yellow-400 fill-yellow-400' />
                  <span className='text-xl font-bold text-white'>
                    {movie.vote_average.toFixed(1)}
                  </span>
                </span>
              )}
              {movie.runtime > 0 && <span>{timeFormat(movie.runtime)}</span>}
              {year && <span>{year}</span>}
              {movie.genres?.length > 0 && (
                <span>{movie.genres.slice(0, 3).map((g) => g.name).join(' • ')}</span>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
              className='flex items-center flex-wrap gap-4 mt-8'
            >
              <a
                href='#dateSelect'
                className='flex items-center gap-2 px-8 py-3.5 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'
              >
                <TicketIcon className='w-4 h-4' />
                Buy Tickets
              </a>
              <button
                onClick={handleFavorite}
                aria-label='Toggle favourite'
                className='bg-white/10 backdrop-blur border border-white/20 p-3 rounded-full transition cursor-pointer active:scale-95 hover:bg-white/20'
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-primary text-primary' : ''}`}
                />
              </button>
            </motion.div>
          </motion.div>

          {/* Synopsis - fades in over the poster as the title clears */}
          <motion.div
            style={{
              opacity: synopsisOpacity,
              y: synopsisY,
              pointerEvents: synopsisPointer,
            }}
            className='absolute inset-0 z-20 flex items-center px-6 md:px-16 lg:px-40 will-change-transform'
          >
            <div className='max-w-2xl'>
              <h2 className='text-sm font-medium tracking-widest uppercase text-primary mb-4'>
                Synopsis
              </h2>
              <p className='text-gray-100 text-lg md:text-2xl leading-relaxed'>
                {movie.overview || 'No synopsis available for this title.'}
              </p>

              {movie.casts?.length > 0 && (
                <p className='text-sm text-gray-400 mt-6'>
                  Starring {movie.casts.slice(0, 3).map((c) => c.name).join(', ')}
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: cueOpacity }}
            className='absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-gray-400'
          >
            <span className='text-[11px] tracking-[0.2em] uppercase'>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className='w-5 h-5' />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Details ---------- */}
      <div className='relative bg-black pt-24'>
        {/* Full-bleed: outside the page gutters so it spans the viewport */}
        <TrailerPlayer videoId={movie.trailer_video_id} title={movie.title} />
      </div>

      <div className='relative px-6 md:px-16 lg:px-40 bg-black'>
        <BlurCircle top='100px' left='-100px' />

        {movie.casts?.length > 0 && (
          <>
            <Reveal>
              <p className='text-lg font-medium mt-20'>Cast</p>
            </Reveal>
            <div className='overflow-x-auto mt-8 pb-4'>
              <StaggerGroup className='flex items-center gap-6 w-max' staggerChildren={0.08}>
                {movie.casts.slice(0, 12).map((cast, index) => (
                  <StaggerItem key={index} className='flex flex-col items-center text-center'>
                    {cast.profile_path ? (
                      <img
                        src={imageUrl(cast.profile_path)}
                        alt={cast.name}
                        className='rounded-full h-20 w-20 aspect-square object-cover'
                      />
                    ) : (
                      <div className='rounded-full h-20 w-20 aspect-square flex items-center justify-center bg-gray-800 border border-gray-700 text-lg font-semibold uppercase'>
                        {cast.name?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </div>
                    )}
                    <p className='font-medium text-xs mt-3 max-w-24 truncate'>{cast.name}</p>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </>
        )}

        <DateSelect dateTime={show.dateTime} id={id} />

        {shows.length > 0 && (
          <>
            <Reveal>
              <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
            </Reveal>
            <StaggerGroup className='flex flex-wrap max-sm:justify-center gap-8' staggerChildren={0.1}>
              {shows.slice(0, 4).map((m) => (
                <StaggerItem key={m._id}>
                  <MovieCard movie={m} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </>
        )}

        <div className='flex justify-center py-20'>
          <button
            onClick={() => {
              navigate('/movies')
              scrollTo(0, 0)
            }}
            className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
          >
            Show more
          </button>
        </div>
      </div>
    </div>
  )
}

export default MovieDetails
