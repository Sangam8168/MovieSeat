import React, { useEffect, useMemo, useState } from 'react'
import { POSTER_PLACEHOLDER, resizeImage } from '../lib/imageUrl'

// An <img> that falls through a list of candidate sources on load error,
// then to an inline placeholder once every candidate has failed.
const SmartImage = ({
  candidates = [],
  src,
  alt = '',
  className = '',
  width = 640,
  ...rest
}) => {
  // Accept either a candidates array or a plain src, de-duplicated.
  // `width` asks IMDb/Amazon for a render at that size - their default is a
  // low-quality 380px image, which looks soft on large surfaces.
  const sources = useMemo(() => {
    const list = [...(candidates || []), src]
      .filter(Boolean)
      .map((u) => resizeImage(u, width))
    return [...new Set(list)]
  }, [candidates, src, width])

  const [index, setIndex] = useState(0)

  // Reset when the source list changes
  useEffect(() => {
    setIndex(0)
  }, [sources.join('|')])

  const exhausted = index >= sources.length
  const current = exhausted ? POSTER_PLACEHOLDER : sources[index]

  return (
    <img
      src={current}
      alt={alt}
      loading='lazy'
      className={className}
      onError={() => {
        if (!exhausted) setIndex((i) => i + 1)
      }}
      {...rest}
    />
  )
}

export default SmartImage
