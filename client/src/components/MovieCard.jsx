import { StarIcon } from 'lucide-react';
import React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat';
import { useAppContext } from '../context/AppContext';
import SmartImage from './SmartImage';

const MovieCard = ({ movie }) => {
    const navigate = useNavigate();
    const { imageUrl } = useAppContext();
    const currency = import.meta.env.VITE_CURRENCY;

    // Pointer-tracked 3D tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
        stiffness: 250,
        damping: 20,
    });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
        stiffness: 250,
        damping: 20,
    });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
        mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const openMovie = () => {
        navigate(`/movie/${movie._id}`);
        scrollTo(0, 0);
    };

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{ rotateX, rotateY, transformPerspective: 900 }}
            className='group relative flex flex-col justify-between p-3 bg-gray-800 rounded-2xl w-66 will-change-transform'
        >
            {/* Glow that fades in on hover */}
            <div className='absolute -inset-0.5 bg-gradient-to-r from-primary/60 to-cyan-500/60 rounded-2xl blur opacity-0 group-hover:opacity-40 transition duration-500 pointer-events-none' />

            <div className='relative'>
                <div className='overflow-hidden rounded-lg'>
                    <motion.div
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <SmartImage
                            onClick={openMovie}
                            candidates={movie.backdrop_candidates?.length ? movie.backdrop_candidates : movie.poster_candidates}
                            src={imageUrl(movie.backdrop_path || movie.poster_path)}
                            alt={movie.title}
                            className='h-52 w-full object-cover object-right-bottom cursor-pointer'
                        />
                    </motion.div>
                </div>

                <p className='font-semibold mt-2 truncate'>{movie.title}</p>
                <p className='text-sm text-gray-400 mt-2'>
                    {new Date(movie.release_date).getFullYear()} •{' '}
                    {movie.genres.slice(0, 2).map((genre) => genre.name).join(' | ')} •{' '}
                    {timeFormat(movie.runtime)}
                </p>

                <div className='flex items-center justify-between mt-4 pb-3'>
                    <motion.button
                        onClick={openMovie}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
                    >
                        Buy Tickets
                    </motion.button>

                    <div className='flex items-center gap-3'>
                        {movie.showPrice != null && (
                            <p className='text-sm font-semibold'>
                                {currency}
                                {movie.showPrice}
                            </p>
                        )}
                        <p className='flex items-center gap-1 text-sm text-gray-400'>
                            <StarIcon className='w-4 h-4 text-primary fill-primary' />
                            {movie.vote_average.toFixed(1)}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default MovieCard
