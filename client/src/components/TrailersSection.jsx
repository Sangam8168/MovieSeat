import React, { useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { dummyTrailers } from '../assets/assets'
import BlurCircle from './BlurCircle';
import { PlayCircleIcon } from 'lucide-react';
import Reveal, { StaggerGroup, StaggerItem, scaleIn, EASE } from './motion/Reveal';

const TrailersSection = () => {
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);
    const sectionRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start'],
    });

    // The player rises and settles as it enters the viewport
    const playerY = useTransform(scrollYProgress, [0, 0.5, 1], [80, 0, -80]);
    const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.35, 0]);

    const getYouTubeId = (url) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    };

    const videoId = getYouTubeId(currentTrailer.videoUrl);

    return (
        <div ref={sectionRef} className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
            <Reveal>
                <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>
            </Reveal>

            <div className='relative mt-6'>
                <BlurCircle top='-100px' right='-100px' />

                <motion.div
                    style={{ y: playerY }}
                    variants={scaleIn}
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, amount: 0.3 }}
                    className='relative mx-auto max-w-full'
                >
                    {/* Soft glow that breathes with scroll position */}
                    <motion.div
                        style={{ opacity: glowOpacity }}
                        className='absolute -inset-6 bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 blur-3xl rounded-3xl pointer-events-none'
                    />

                    <div
                        className='relative mx-auto max-w-full'
                        style={{ width: '960px', height: '540px' }}
                    >
                        <AnimatePresence mode='wait'>
                            {videoId ? (
                                <motion.div
                                    key={videoId}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.45, ease: EASE }}
                                    className='relative w-full h-full rounded-lg overflow-hidden ring-1 ring-white/10'
                                >
                                    <iframe
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                                        title='YouTube video player'
                                        frameBorder='0'
                                        allow='accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                                        allowFullScreen
                                        className='absolute top-0 left-0 w-full h-full'
                                    />
                                </motion.div>
                            ) : (
                                <div className='w-full h-full bg-gray-800 flex items-center justify-center rounded-lg'>
                                    <p className='text-white'>Video not available</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>

            <StaggerGroup
                className='group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'
                staggerChildren={0.1}
            >
                {dummyTrailers.map((trailer) => {
                    const isActive = trailer.videoUrl === currentTrailer.videoUrl;
                    return (
                        <StaggerItem key={trailer.image}>
                            <motion.div
                                whileHover={{ y: -6, scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                className={`relative group-hover:not-hover:opacity-50 max-md:h-60 md:max-h-60 cursor-pointer rounded-lg overflow-hidden ${
                                    isActive ? 'ring-2 ring-primary' : ''
                                }`}
                                onClick={() => setCurrentTrailer(trailer)}
                            >
                                <img
                                    src={trailer.image}
                                    alt='trailer'
                                    className='rounded-lg w-full h-full object-cover brightness-75'
                                />
                                <PlayCircleIcon
                                    strokeWidth={1.6}
                                    className='absolute top-1/2 left-1/2 w-5 md:w-12 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2 text-white'
                                />
                            </motion.div>
                        </StaggerItem>
                    );
                })}
            </StaggerGroup>
        </div>
    );
};

export default TrailersSection;
