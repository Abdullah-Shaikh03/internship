// Update the color extractor to handle CORS issues better

export async function extractColors(imageUrl) {
    try {
      // Create a new image element
      const img = new Image()
      img.crossOrigin = "anonymous"
  
      // Wait for the image to load
      const imageLoaded = new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
  
        // Set timeout to prevent hanging
        setTimeout(() => reject(new Error("Image load timeout")), 5000)
      })
  
      img.src = imageUrl
  
      try {
        await imageLoaded
      } catch (error) {
        console.error("Image loading error:", error)
        return null
      }
  
      // Create a canvas element
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
  
      if (!ctx) return null
  
      // Set canvas dimensions to image dimensions (or fallback to reasonable size if 0)
      canvas.width = img.width || 100
      canvas.height = img.height || 100
  
      // Draw the image on the canvas
      try {
        ctx.drawImage(img, 0, 0)
  
        // Get image data - wrap in try/catch as this can fail with CORS
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  
        // Sample colors from different parts of the image
        const colors = []
  
        // Sample from top left
        const topLeft = sampleColor(imageData, 0, 0, canvas.width)
        colors.push(topLeft)
  
        // Sample from bottom right
        const bottomRight = sampleColor(imageData, canvas.width - 1, canvas.height - 1, canvas.width)
        colors.push(bottomRight)
  
        return colors
      } catch (error) {
        console.error("Canvas operation error:", error)
        // Return default colors if we can't extract from the image
        return ["rgb(45, 55, 72)", "rgb(26, 32, 44)"]
      }
    } catch (error) {
      console.error("Error extracting colors:", error)
      // Return default colors if we can't extract from the image
      return ["rgb(45, 55, 72)", "rgb(26, 32, 44)"]
    }
  }
  
  // Helper function to sample a color from a specific position
  function sampleColor(imageData, x, y, width) {
    const index = (y * width + x) * 4
    const r = imageData[index]
    const g = imageData[index + 1]
    const b = imageData[index + 2]
  
    // Darken the color slightly for better contrast with white text
    const darkenFactor = 0.7
    const darkenedR = Math.floor(r * darkenFactor)
    const darkenedG = Math.floor(g * darkenFactor)
    const darkenedB = Math.floor(b * darkenFactor)
  
    return `rgb(${darkenedR}, ${darkenedG}, ${darkenedB})`
  }
  
  