"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Home, Heart, Clock, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { musicData } from "@/data/music-data"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { extractColors } from "@/lib/color-extractor"

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

export default function MusicPlayer() {
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [favorites, setFavorites] = useState([])
  const [filteredSongs, setFilteredSongs] = useState(musicData)
  const [bgColor, setBgColor] = useState("from-purple-900 to-blue-900")
  const audioRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()

    // Check if mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }

    const storedRecentlyPlayed = sessionStorage.getItem("recentlyPlayed")
    if (storedRecentlyPlayed) {
      setRecentlyPlayed(JSON.parse(storedRecentlyPlayed))
    }
  }, [])

  // Update localStorage when favorites change
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites))
  }, [favorites])

  // Update sessionStorage when recently played changes
  useEffect(() => {
    sessionStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed))
  }, [recentlyPlayed])

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSongs(musicData)
    } else {
      const filtered = musicData.filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredSongs(filtered)
    }
  }, [searchQuery])

  // Handle audio playback
  useEffect(() => {
    if (!audioRef.current || !currentSong) return

    if (isPlaying) {
      setIsLoading(true)
      // Set audio source and properties
      audioRef.current.src = currentSong.musicUrl
      audioRef.current.volume = volume

      // Add proper error handling for playback
      audioRef.current
        .play()
        .catch((err) => {
          console.error("Playback error:", err)
          setIsPlaying(false)
          setError("Could not play this track. Please try another one.")
        })
        .finally(() => {
          setIsLoading(false)
        })

      // Extract background color from thumbnail
      extractColors(currentSong.thumbnail)
        .then((colors) => {
          if (colors && colors.length > 0) {
            setBgColor(`from-[${colors[0]}] to-[${colors[1] || colors[0]}]`)
          }
        })
        .catch(() => {
          // Fallback gradient if extraction fails
          setBgColor("from-purple-900 to-blue-900")
        })
    } else {
      audioRef.current.pause()
    }

    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    const handleEnded = () => {
      playNextSong()
    }

    // Add error handler for audio element
    const handleError = (e) => {
      console.error("Audio error:", e)
      setIsPlaying(false)
    }

    audioRef.current.addEventListener("timeupdate", updateTime)
    audioRef.current.addEventListener("ended", handleEnded)
    audioRef.current.addEventListener("error", handleError)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", updateTime)
        audioRef.current.removeEventListener("ended", handleEnded)
        audioRef.current.removeEventListener("error", handleError)
      }
    }
  }, [currentSong, isPlaying])

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const playSong = (song) => {
    // Reset error state
    setError(null)
    setIsLoading(true)

    // Add to recently played
    const updatedRecentlyPlayed = [song, ...recentlyPlayed.filter((s) => s.title !== song.title)]
    // Keep only the last 10 songs
    setRecentlyPlayed(updatedRecentlyPlayed.slice(0, 10))

    setCurrentSong(song)
    setIsPlaying(true)
  }

  const togglePlayPause = () => {
    if (!currentSong && musicData.length > 0) {
      playSong(musicData[0])
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  const playNextSong = () => {
    if (!currentSong) return

    const currentIndex = musicData.findIndex((song) => song.title === currentSong.title)
    const nextIndex = (currentIndex + 1) % musicData.length
    playSong(musicData[nextIndex])
  }

  const playPreviousSong = () => {
    if (!currentSong) return

    const currentIndex = musicData.findIndex((song) => song.title === currentSong.title)
    const prevIndex = (currentIndex - 1 + musicData.length) % musicData.length
    playSong(musicData[prevIndex])
  }

  const handleSeek = (value) => {
    if (audioRef.current && currentSong) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const toggleFavorite = (song) => {
    if (favorites.some((fav) => fav.title === song.title)) {
      setFavorites(favorites.filter((fav) => fav.title !== song.title))
    } else {
      setFavorites([...favorites, song])
    }
  }

  const isFavorite = (song) => {
    return favorites.some((fav) => fav.title === song.title)
  }

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${bgColor} transition-colors duration-1000 ease-in-out`}>
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Mobile view with sheet for song list */}
        {isMobile && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Music Player</h1>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-menu"
                    >
                      <line x1="4" x2="20" y1="12" y2="12" />
                      <line x1="4" x2="20" y1="6" y2="6" />
                      <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <div className="py-4">
                    <div className="relative mb-6">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search songs..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Tabs defaultValue="all">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="all" className="flex-1">
                          <Home className="h-4 w-4 mr-2" />
                          All Songs
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="flex-1">
                          <Heart className="h-4 w-4 mr-2" />
                          Favorites
                        </TabsTrigger>
                        <TabsTrigger value="recent" className="flex-1">
                          <Clock className="h-4 w-4 mr-2" />
                          Recent
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="all" className="mt-0">
                        <SongList
                          songs={filteredSongs}
                          currentSong={currentSong}
                          isPlaying={isPlaying}
                          onPlay={playSong}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={isFavorite}
                        />
                      </TabsContent>
                      <TabsContent value="favorites" className="mt-0">
                        <SongList
                          songs={favorites}
                          currentSong={currentSong}
                          isPlaying={isPlaying}
                          onPlay={playSong}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={isFavorite}
                        />
                      </TabsContent>
                      <TabsContent value="recent" className="mt-0">
                        <SongList
                          songs={recentlyPlayed}
                          currentSong={currentSong}
                          isPlaying={isPlaying}
                          onPlay={playSong}
                          onToggleFavorite={toggleFavorite}
                          isFavorite={isFavorite}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <NowPlaying
              currentSong={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={audioRef.current?.duration || 0}
              onTogglePlayPause={togglePlayPause}
              onPrevious={playPreviousSong}
              onNext={playNextSong}
              onSeek={handleSeek}
              onVolumeChange={setVolume}
              volume={volume}
              isLoading={isLoading}
              error={error}
            />
          </div>
        )}

        {/* Desktop view with side-by-side layout */}
        {!isMobile && (
          <>
            <div className="w-full md:w-1/3 lg:w-1/4">
              <h1 className="text-2xl font-bold text-white mb-6">Music Player</h1>
              <div className="relative mb-6">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search songs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs defaultValue="all">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="all" className="flex-1">
                    <Home className="h-4 w-4 mr-2" />
                    All Songs
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="flex-1">
                    <Clock className="h-4 w-4 mr-2" />
                    Recent
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <SongList
                    songs={filteredSongs}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlay={playSong}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                </TabsContent>
                <TabsContent value="favorites" className="mt-0">
                  <SongList
                    songs={favorites}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlay={playSong}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                </TabsContent>
                <TabsContent value="recent" className="mt-0">
                  <SongList
                    songs={recentlyPlayed}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlay={playSong}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                  />
                </TabsContent>
              </Tabs>
            </div>
            <div className="w-full md:w-2/3 lg:w-3/4 flex items-center justify-center">
              <NowPlaying
                currentSong={currentSong}
                isPlaying={isPlaying}
                isLoading={isLoading}
                error={error}
                currentTime={currentTime}
                duration={audioRef.current?.duration || 0}
                onTogglePlayPause={togglePlayPause}
                onPrevious={playPreviousSong}
                onNext={playNextSong}
                onSeek={handleSeek}
                onVolumeChange={setVolume}
                volume={volume}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SongList({ songs, currentSong, isPlaying, onPlay, onToggleFavorite, isFavorite }) {
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
      {songs.length === 0 ? (
        <div className="text-center py-8 text-white/70">No songs found</div>
      ) : (
        songs.map((song) => (
          <div
            key={song.title}
            className={cn(
              "flex items-center p-2 rounded-lg transition-all",
              currentSong?.title === song.title ? "bg-white/20" : "hover:bg-white/10",
            )}
          >
            <div className="w-10 h-10 rounded overflow-hidden mr-3 cursor-pointer" onClick={() => onPlay(song)}>
              <img src={song.thumbnail || "/placeholder.svg"} alt={song.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 cursor-pointer" onClick={() => onPlay(song)}>
              <h3 className="text-sm font-medium text-white truncate">{song.title}</h3>
              <p className="text-xs text-white/70 truncate">{song.artistName}</p>
            </div>
            <div className="flex items-center">
              {currentSong?.title === song.title && isPlaying && (
                <div className="w-4 h-4 mr-2">
                  <div className="flex h-full items-end justify-between gap-[2px]">
                    <div className="w-[2px] h-[60%] bg-white animate-music-bar"></div>
                    <div className="w-[2px] h-full bg-white animate-music-bar animation-delay-200"></div>
                    <div className="w-[2px] h-[80%] bg-white animate-music-bar animation-delay-400"></div>
                  </div>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onToggleFavorite(song)}>
                    {isFavorite(song) ? (
                      <>
                        <Heart className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
                        Remove from favorites
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Add to favorites
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function NowPlaying({
  currentSong,
  isPlaying,
  isLoading = false,
  error = null,
  currentTime,
  duration,
  onTogglePlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  volume,
}) {
  return (
    <div className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-md rounded-xl p-6 text-white">
      {currentSong ? (
        <>
          <div className="aspect-square rounded-lg overflow-hidden mb-6 shadow-xl relative">
            <img
              src={currentSong.thumbnail || "/placeholder.svg"}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold mb-1">{currentSong.title}</h2>
            <p className="text-white/70">{currentSong.artistName}</p>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={onSeek}
              className="cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onPrevious}>
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-14 w-14 rounded-full bg-white text-black hover:bg-white/90"
              onClick={onTogglePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6 ml-1" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={onNext}>
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center mt-6 gap-2">
            <Volume2 className="h-4 w-4 text-white/70" />
            <Slider
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => onVolumeChange(value[0] / 100)}
              className="cursor-pointer"
            />
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold mb-4">No song selected</h2>
          <p className="text-white/70 mb-6">Select a song to start playing</p>
          <Button
            variant="default"
            size="lg"
            className="rounded-full bg-white text-black hover:bg-white/90"
            onClick={onTogglePlayPause}
          >
            <Play className="h-5 w-5 mr-2 ml-1" />
            Play
          </Button>
        </div>
      )}
    </div>
  )
}

