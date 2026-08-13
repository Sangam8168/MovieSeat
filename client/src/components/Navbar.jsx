import React, { useState } from 'react'
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import { assets } from '../assets/assets';
import { LayoutDashboardIcon, LogOutIcon, MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {

  const [isOpen , setIsOpen] = useState(false);

  const {user, logout, isAdmin} = useAppContext();

  const navigate = useNavigate();



   const { favoriteMovies } = useAppContext();
  return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5'>
     <Link to='/' className='max-md:flex-1'>
  <div className="flex items-center space-x-3 group">
    {/* Movie clapper with animation */}
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
      <div className="relative w-10 h-12 bg-gradient-to-br from-gray-900 to-black rounded-lg border border-gray-800 p-2">
        {/* Film strip */}
        <div className="space-y-1">
          <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
          <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
          <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </div>
        {/* Clapper handle */}
        <div className="absolute top-2 -right-1 w-2 h-8 bg-gradient-to-b from-gray-700 to-gray-900 rounded transform group-hover:rotate-12 transition-transform"></div>
      </div>
    </div>
    
    {/* Text */}
    <div>
      <h1 className="text-2xl font-bold tracking-wide">
        <span className="text-red-400 group-hover:text-red-300 transition-colors">Movie</span>
        <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">Seat</span>
      </h1>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-px bg-gradient-to-r from-red-500 to-transparent"></div>
        <span className="text-xs text-gray-400 font-medium tracking-widest">MOVIES</span>
        <div className="w-6 h-px bg-gradient-to-l from-cyan-500 to-transparent"></div>
      </div>
    </div>
  </div>
</Link>
    <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`} >

      <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={()=>setIsOpen(!isOpen)} />

      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}} to='/' >Home</Link>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}}  to='/movies' >Movies</Link>
      <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}}  to='/my-bookings' >My Booking</Link>
      
      { favoriteMovies.length > 0 &&  <Link onClick={()=>{scrollTo(0,0); setIsOpen(false)}}  to='/favorite' >Favourite</Link>}

      { isAdmin && (
        <Link
          onClick={()=>{scrollTo(0,0); setIsOpen(false)}}
          to='/admin'
          className='flex items-center gap-1.5 text-primary font-medium'
        >
          <LayoutDashboardIcon className='w-4 h-4' />
          Admin
        </Link>
      )}
    </div >
    <div className='flex items-center gap-8' > 
    

      {
        !user ? (
            <button onClick={()=> navigate('/login')} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer' >Login</button>
        ) : (
          <div className='relative group'>
            <button className='w-9 h-9 rounded-full bg-primary flex items-center justify-center font-semibold uppercase cursor-pointer'>
              {user.name?.[0] || 'U'}
            </button>
            <div className='absolute right-0 top-full pt-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition'>
              <div className='bg-black/90 border border-gray-300/20 rounded-md overflow-hidden'>
                <button onClick={()=> navigate('/my-bookings')} className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer'>
                  <TicketPlus width={15} /> My Bookings
                </button>
                {isAdmin && (
                  <button onClick={()=> navigate('/admin')} className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer'>
                    <LayoutDashboardIcon width={15} /> Admin Dashboard
                  </button>
                )}
                <button onClick={logout} className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 cursor-pointer'>
                  <LogOutIcon width={15} /> Logout
                </button>
              </div>
            </div>
          </div>
        )
      }

      
    </div>
    <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
    </div>
    
  )
}

export default Navbar