import React, { useEffect } from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'

const Movies = () => {
  const { shows, fetchShows } = useAppContext();

  // Refetch on mount so newly added shows appear
  useEffect(() => {
    fetchShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return shows.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>

      <BlurCircle top='150px' left='0px' />
      <BlurCircle top='50px' right='50px' />
      <h1 className='text-lg font-medium my-4'>Now Showing</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {shows.map((movie) => (
          <MovieCard movie={movie} key={movie._id} /> 
        ))}
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen gap-3 px-6'>
      <h2 className='text-3xl font-bold text-center'>No movies available</h2>
      <p className='text-gray-400 text-sm text-center max-w-md'>
        This page lists movies that have an upcoming show. Add one from
        Admin &rarr; Add Shows, and make sure the showtime is in the future.
      </p>
    </div>
  )
}

export default Movies