
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'חסר קישור יוטיוב' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Getting YouTube video info:', url)

    // Extract video ID from URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'לא ניתן לחלץ מזהה וידאו' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get video info using YouTube Data API
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'YouTube API key לא הוגדר' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const videoInfoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`
    )

    if (!videoInfoResponse.ok) {
      throw new Error('שגיאה בקבלת מידע מ-YouTube API')
    }

    const videoData = await videoInfoResponse.json()
    
    if (!videoData.items || videoData.items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'וידאו לא נמצא' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const video = videoData.items[0]
    const title = video.snippet.title
    const duration = parseDuration(video.contentDetails.duration)
    const thumbnail = video.snippet.thumbnails.maxres?.url || 
                     video.snippet.thumbnails.high?.url || 
                     video.snippet.thumbnails.medium?.url

    // Check for captions
    let hasSubtitles = false
    try {
      const captionsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${youtubeApiKey}`
      )
      
      if (captionsResponse.ok) {
        const captionsData = await captionsResponse.json()
        hasSubtitles = captionsData.items && captionsData.items.length > 0
      }
    } catch (error) {
      console.log('Could not check captions:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        title,
        duration,
        thumbnail,
        hasSubtitles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('YouTube info error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'שגיאה בקבלת מידע על הוידאו' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT4M13S -> 253 seconds)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}
