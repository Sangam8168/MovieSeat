import React from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import HeroSection from '../components/HeroSection'
import FeaturedSection from '../components/FeaturedSection'
import ComingSoonSection from '../components/ComingSoonSection'
import TrailersSection from '../components/TrailersSection'

const Home = () => {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <div className='relative'>
      {/* Reading-progress bar pinned to the top of the viewport */}
      <motion.div
        style={{ scaleX: progress }}
        className='fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-red-500 via-orange-500 to-cyan-500'
      />

      <HeroSection />
      <FeaturedSection />
      <ComingSoonSection />
      <TrailersSection />
    </div>
  )
}

export default Home
