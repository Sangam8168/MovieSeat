import { ArrowRight } from 'lucide-react';
import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BlurCircle from './BlurCircle';
import MovieCard from './MovieCard';
import { useAppContext } from '../context/AppContext';
import Reveal, { StaggerGroup, StaggerItem } from './motion/Reveal';

const FeaturedSection = () => {
    const navigate = useNavigate();
    const { shows } = useAppContext();
    const sectionRef = useRef(null);

    // Gentle parallax drift on the whole row as it passes through the viewport
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });
    const rowY = useTransform(scrollYProgress, [0, 1], [60, -60]);

    return (
        <div ref={sectionRef} className='px-6 md:px-16 lg:px-24 xl:px-44 overflow-hidden'>
            <div className='relative flex items-center justify-between pt-20 pb-10'>
                <BlurCircle top='0' right='-80px' />

                <Reveal>
                    <p className='text-gray-300 font-medium text-lg'>Now Showing</p>
                </Reveal>

                <Reveal delay={0.1}>
                    <button
                        onClick={() => navigate('/movies')}
                        className='group flex items-center gap-2 text-sm text-gray-300 cursor-pointer'
                    >
                        View All
                        <ArrowRight className='group-hover:translate-x-0.5 transition w-4.5 h-4.5' />
                    </button>
                </Reveal>
            </div>

            <motion.div style={{ y: rowY }}>
                <StaggerGroup
                    className='flex flex-wrap max-sm:justify-center gap-8 mt-8'
                    staggerChildren={0.12}
                >
                    {shows.slice(0, 4).map((show) => (
                        <StaggerItem key={show._id}>
                            <MovieCard movie={show} />
                        </StaggerItem>
                    ))}
                </StaggerGroup>
            </motion.div>

            <Reveal className='flex justify-center mt-20'>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    onClick={() => { navigate('/movies'); scrollTo(0, 0) }}
                    className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
                >
                    Show more
                </motion.button>
            </Reveal>
        </div>
    )
}

export default FeaturedSection
