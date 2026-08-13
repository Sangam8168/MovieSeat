import React, { useRef } from 'react'
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionTemplate,
} from 'framer-motion'
import { ArrowRight, ChevronDown, Sparkles, Ticket, Calendar, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Reveal, { StaggerGroup, StaggerItem, EASE, fadeUp } from './motion/Reveal'
import Counter from './motion/Counter'

const features = [
    {
        icon: Calendar,
        title: 'Real-time Showtimes',
        copy: 'Live updates on movie schedules across all theatres. Never miss a show again.',
        accent: 'cyan',
    },
    {
        icon: Ticket,
        title: 'Smart Seat Selection',
        copy: 'Interactive seat maps with best-view recommendations for optimal cinema experience.',
        accent: 'red',
    },
    {
        icon: TrendingUp,
        title: 'Trending Now',
        copy: "Discover what's hot based on real-time ratings and community reviews.",
        accent: 'purple',
    },
]

const accentMap = {
    cyan: {
        border: 'hover:border-cyan-500',
        glow: 'from-cyan-500 to-blue-500',
        chip: 'from-cyan-500/20 to-blue-500/20',
        text: 'text-cyan-400',
    },
    red: {
        border: 'hover:border-red-500',
        glow: 'from-red-500 to-orange-500',
        chip: 'from-red-500/20 to-orange-500/20',
        text: 'text-red-400',
    },
    purple: {
        border: 'hover:border-purple-500',
        glow: 'from-purple-500 to-pink-500',
        chip: 'from-purple-500/20 to-pink-500/20',
        text: 'text-purple-400',
    },
}

const stats = [
    { value: 98, suffix: '%', label: 'Customer Satisfaction', color: 'text-red-400' },
    { value: 24, suffix: '/7', label: 'Booking Support', color: 'text-cyan-400' },
    { value: 5, suffix: 'M+', label: 'Happy Moviegoers', color: 'text-yellow-400' },
    { value: 50, suffix: '+', label: 'Cities Served', color: 'text-purple-400' },
]

// Headline words animate in one at a time on first paint
const wordVariants = {
    hidden: { opacity: 0, y: '110%' },
    visible: (i) => ({
        opacity: 1,
        y: '0%',
        transition: { duration: 0.9, ease: EASE, delay: 0.15 + i * 0.09 },
    }),
}

const Word = ({ children, index, className = '' }) => (
    <span className='inline-block overflow-hidden align-bottom'>
        <motion.span
            custom={index}
            variants={wordVariants}
            initial='hidden'
            animate='visible'
            className={`inline-block ${className}`}
        >
            {children}
        </motion.span>
    </span>
)

const HeroSection = () => {
    const navigate = useNavigate()
    const stageRef = useRef(null)

    // Drives the "cinema screen pulls away" effect while the hero is pinned
    const { scrollYProgress } = useScroll({
        target: stageRef,
        offset: ['start start', 'end start'],
    })

    const smooth = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 24,
        restDelta: 0.001,
    })

    const titleScale = useTransform(smooth, [0, 1], [1, 1.28])
    const titleY = useTransform(smooth, [0, 1], [0, -140])
    const titleOpacity = useTransform(smooth, [0, 0.55], [1, 0])
    const blurAmount = useTransform(smooth, [0, 0.7], [0, 12])
    const titleFilter = useMotionTemplate`blur(${blurAmount}px)`

    // Background blobs drift at different speeds for depth
    const blobOneY = useTransform(smooth, [0, 1], [0, -220])
    const blobTwoY = useTransform(smooth, [0, 1], [0, 180])
    const blobThreeY = useTransform(smooth, [0, 1], [0, -90])
    const vignette = useTransform(smooth, [0, 1], [0.25, 0.85])

    const cueOpacity = useTransform(smooth, [0, 0.15], [1, 0])

    return (
        <div className='bg-gradient-to-br from-gray-900 via-black to-gray-900'>
            {/* ---------- Pinned hero stage ---------- */}
            <section ref={stageRef} className='relative h-[190vh]'>
                <div className='sticky top-0 h-screen overflow-hidden flex items-center justify-center px-6 md:px-16 lg:px-36'>
                    {/* Parallax glow field */}
                    <motion.div
                        style={{ y: blobOneY }}
                        className='absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl'
                    />
                    <motion.div
                        style={{ y: blobTwoY }}
                        className='absolute bottom-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl'
                    />
                    <motion.div
                        style={{ y: blobThreeY }}
                        className='absolute top-1/2 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl'
                    />

                    {/* Darkening vignette as you scroll, like house lights going down */}
                    <motion.div
                        style={{ opacity: vignette }}
                        className='absolute inset-0 bg-black pointer-events-none'
                    />

                    <motion.div
                        style={{
                            scale: titleScale,
                            y: titleY,
                            opacity: titleOpacity,
                            filter: titleFilter,
                        }}
                        className='relative z-10 text-center max-w-5xl will-change-transform'
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: EASE }}
                            className='inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-gray-700 bg-white/5 backdrop-blur-sm text-xs tracking-widest uppercase text-gray-300'
                        >
                            <Sparkles className='w-3.5 h-3.5 text-yellow-400' />
                            Now booking
                        </motion.div>

                        <h1 className='text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.05]'>
                            <span className='block text-gray-300'>
                                <Word index={0}>Where</Word> <Word index={1}>Every</Word>
                            </span>
                            <Word
                                index={2}
                                className='bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent'
                            >
                                Seat Tells
                            </Word>{' '}
                            <Word
                                index={3}
                                className='bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent'
                            >
                                A Story
                            </Word>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
                            className='text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed'
                        >
                            Step into a world of cinematic wonder. From blockbuster premieres to
                            indie gems, your perfect movie night begins here.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}
                            className='relative group inline-block'
                        >
                            <div className='absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-300' />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                onClick={() => navigate('/movies')}
                                className='relative flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-gray-900 to-black rounded-full font-bold text-lg border border-gray-800 hover:border-transparent cursor-pointer'
                            >
                                <Sparkles className='w-6 h-6 text-yellow-400' />
                                <span className='text-white'>Explore Movies</span>
                                <ArrowRight className='w-5 h-5 text-white group-hover:translate-x-2 transition-transform' />
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    {/* Scroll cue */}
                    <motion.div
                        style={{ opacity: cueOpacity }}
                        className='absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500'
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

            {/* ---------- Features ---------- */}
            <section className='relative px-6 md:px-16 lg:px-36 py-24'>
                <Reveal className='text-center mb-16'>
                    <h2 className='text-3xl md:text-5xl font-bold text-white mb-4'>
                        Built for the way you watch.
                    </h2>
                    <p className='text-gray-400 max-w-2xl mx-auto'>
                        Everything between picking a film and sinking into your seat, handled.
                    </p>
                </Reveal>

                <StaggerGroup
                    className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'
                    staggerChildren={0.14}
                >
                    {features.map(({ icon: Icon, title, copy, accent }) => {
                        const a = accentMap[accent]
                        return (
                            <StaggerItem key={title} variants={fadeUp}>
                                <motion.div
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className={`group relative h-full p-6 bg-gradient-to-br from-gray-900/50 to-black/50 rounded-2xl border border-gray-800 ${a.border} cursor-pointer`}
                                >
                                    <div
                                        className={`absolute -inset-0.5 bg-gradient-to-r ${a.glow} rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500`}
                                    />
                                    <div className='relative'>
                                        <div
                                            className={`inline-flex p-3 bg-gradient-to-br ${a.chip} rounded-xl mb-4`}
                                        >
                                            <Icon className={`w-7 h-7 ${a.text}`} />
                                        </div>
                                        <h3 className='text-xl font-bold mb-3 text-white'>{title}</h3>
                                        <p className='text-gray-400 text-sm'>{copy}</p>
                                    </div>
                                </motion.div>
                            </StaggerItem>
                        )
                    })}
                </StaggerGroup>
            </section>

            {/* ---------- Stats ---------- */}
            <section className='px-6 md:px-16 lg:px-36 pb-24'>
                <StaggerGroup
                    className='flex flex-wrap justify-center gap-12 md:gap-20 pt-12 border-t border-gray-800/50 max-w-5xl mx-auto'
                    staggerChildren={0.1}
                >
                    {stats.map(({ value, suffix, label, color }) => (
                        <StaggerItem key={label} className='text-center'>
                            <div className={`text-4xl font-bold mb-2 ${color}`}>
                                <Counter value={value} suffix={suffix} />
                            </div>
                            <div className='text-sm text-gray-400'>{label}</div>
                        </StaggerItem>
                    ))}
                </StaggerGroup>
            </section>
        </div>
    )
}

export default HeroSection
