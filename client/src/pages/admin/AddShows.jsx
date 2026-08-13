import { CheckIcon, DeleteIcon, StarIcon } from "lucide-react";
import React, { useEffect, useState } from 'react'
import { dummyShowsData } from '../../assets/assets';
import Title from '../../components/admin/Title';
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import SmartImage from "../../components/SmartImage";
import toast from "react-hot-toast";

const AddShows = () => {

  const {axios, getToken, user, imageUrl, fetchShows} = useAppContext()

  const currency = import.meta.env.VITE_CURRENCY;
  // Stripe rejects charges that convert to under ~$0.50
  const MIN_PRICE = 50;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = not searching
  const [searching, setSearching] = useState(false);
  const [sourceNote, setSourceNote] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [addingShow, setAddingShow] = useState(false);

 const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get("/api/show/now-playing", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setNowPlayingMovies(data.movies);
        if (data.note) setSourceNote(data.note);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      setSearching(true);
      const { data } = await axios.get("/api/show/search", {
        params: { query },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setSearchResults(data.success ? data.movies : []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [date]: filteredTimes,
      };
    });
  };

const handleSubmit = async () => {
    if (!selectedMovie) {
      return toast.error("Pick a movie first");
    }
    if (Object.keys(dateTimeSelection).length === 0) {
      return toast.error("Add at least one date and time");
    }
    if (!showPrice || Number(showPrice) <= 0) {
      return toast.error("Enter a show price");
    }
    if (Number(showPrice) < MIN_PRICE) {
      return toast.error(
        `Show price must be at least ${currency}${MIN_PRICE} - Stripe rejects smaller payments`
      );
    }

    try {
      setAddingShow(true);

      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, time]) => ({ date, time })
      );

      const { data } = await axios.post(
        "/api/show/add",
        {
          movieId: selectedMovie,
          showsInput,
          showPrice: Number(showPrice),
          trailerUrl: trailerUrl.trim(),
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        toast.success(data.message || "Show added");
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice("");
        setTrailerUrl("");
        await fetchShows();
      } else {
        toast.error(data.message || "Could not add the show");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error.response?.data?.message || error.message || "An error occurred"
      );
    } finally {
      setAddingShow(false);
    }
  };
  

  useEffect(()=> {
    if(user){

      fetchNowPlayingMovies();
    }
  }, [user])







  // Search results take over the grid while a search is active
  const displayedMovies = searchResults ?? nowPlayingMovies;
  const isSearching = searchResults !== null;

  return (
    <>
      <Title text1="Add" text2="Shows" />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mt-8 max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search a movie by title, e.g. Inception"
          className="flex-1 px-4 py-2 rounded-md bg-black/30 border border-gray-600 outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-md text-sm font-medium cursor-pointer disabled:opacity-50"
        >
          {searching ? "..." : "Search"}
        </button>
        {isSearching && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-4 py-2 border border-gray-600 rounded-md text-sm cursor-pointer hover:bg-white/5"
          >
            Clear
          </button>
        )}
      </form>

      <p className="mt-8 text-lg font-medium">
        {isSearching ? `Search results for "${searchQuery}"` : "Find a movie"}
      </p>

      {sourceNote && !isSearching && (
        <p className="text-xs text-amber-400/90 mt-1 max-w-xl">{sourceNote}</p>
      )}

      {displayedMovies.length === 0 && (
        <p className="text-gray-400 text-sm mt-4">
          {isSearching
            ? "No movies matched that title."
            : "Search by title above to pick a movie, then set the price and showtimes below."}
        </p>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {displayedMovies.map((movie) => (
            <div key={movie.id}
              className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
              onClick={() => setSelectedMovie(movie.id)} >
                <div className="relative rounded-lg overflow-hidden">
                   <SmartImage
                  candidates={movie.poster_candidates}
                  src={ imageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="w-full object-cover brightness-90"
                />
                {/* Only shown when a rating is available */}
                {movie.vote_average != null && (
                  <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                    <p className="flex items-center gap-1 text-gray-400">
                      <StarIcon className="w-4 h-4 text-primary fill-primary" />
                      {Number(movie.vote_average).toFixed(1)}
                    </p>
                    {movie.vote_count != null && (
                      <p className="text-gray-300">
                        {kConverter(movie.vote_count)} Votes
                      </p>
                    )}
                  </div>
                )}

                </div>

                {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
               <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.year || movie.release_date}</p>



            </div>
          ))}
        </div>


      </div>

          {/* Show Price Input */}
      <div className="mt-8">
        <label className="block text-sm font-medium mb-2">
          Show Price <span className="text-gray-500">(min {currency}{MIN_PRICE})</span>
        </label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            min={MIN_PRICE}
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder={`Minimum ${MIN_PRICE}`}
            className="outline-none"
          />
        </div>
      </div>

      {/* Trailer */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Trailer URL <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="url"
          value={trailerUrl}
          onChange={(e) => setTrailerUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full max-w-md px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none focus:border-primary"
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave blank to search YouTube automatically.
        </p>
      </div>

      {/* Date & Time Selection */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Date and Time
        </label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>

      {/* Display Selected Times */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {addingShow ? "Adding..." : "Add Show"}
      </button>




    </>
  )
}

export default AddShows