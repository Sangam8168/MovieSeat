import React, { useEffect, useState } from 'react'
import { dummyBookingData } from '../assets/assets';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeFormat from '../lib/timeFormat';
import { dateFormat } from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';
import SmartImage from '../components/SmartImage';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY
     const {
      
      axios,
      getToken,
      user,
      imageUrl,
    } = useAppContext();

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getMyBookings = async () =>{
    try {
      const { data } = await axios.get("/api/user/bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  useEffect(()=>{
    if(user){

      getMyBookings()
    }
  },[user])

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top="100px" left="100px"/>
      <div>
        <BlurCircle bottom="0px" left="600px"/>
      </div>
      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>
      {bookings.map((item, index)=>(
      <div key={index} className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>
        <div className='flex flex-col md:flex-row'>
          <SmartImage candidates={item.show.movie.poster_candidates} src={imageUrl(item.show.movie.poster_path)} alt={item.show.movie.title} className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'/>
          <div className='flex flex-col p-4'>
          <p className='text-lg font-semibold'>{item.show.movie.title}</p>
          <p className='text-gray-400 text-sm'>{timeFormat(item.show.movie.runtime)}</p>
          <p className='text-gray-400 text-sm mt-auto'>{dateFormat( item.show.showDateTime)}</p>
        </div>
        </div>
        <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
          <div className='flex items-center gap-4'>
            <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
            {item.isPaid ? (
              <span className='flex items-center gap-1.5 mb-3 px-3 py-1.5 text-xs font-medium rounded-full bg-green-500/15 text-green-400 border border-green-500/30'>
                <CheckCircle2 className='w-3.5 h-3.5' />
                Paid
              </span>
            ) : item.paymentLink ? (
              <Link
                to={item.paymentLink}
                className='bg-primary hover:bg-primary-dull transition px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer'
              >
                Pay Now
              </Link>
            ) : (
              <span className='mb-3 px-3 py-1.5 text-xs rounded-full bg-gray-700/40 text-gray-400 border border-gray-600'>
                Payment pending
              </span>
            )}
          </div>
          <div className='text-sm'>
            <p><span className='text-gray-400'>Total Tickets:</span> {item.bookedSeats.length}</p>
            <p><span className='text-gray-400'>Seat Number:</span> {item.bookedSeats.join(", ")}</p>



          </div>
        </div>




      </div>
    ))}    
     

    </div>
  ) : <Loading />
}

export default MyBookings