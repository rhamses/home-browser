export type WeatherKind =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'fog'
  | 'unknown'

export type LocationWeather = {
  cityLabel: string
  tempC: string
  kind: WeatherKind
}

export type WeatherHourSlot = {
  /** Ex.: "qui. 09:00" */
  label: string
  tempC: string
  feelsLikeC: string
  humidity: string
  desc: string
  windKmph: string
  windDir: string
  chanceRain: string
}

export type DetailedWeatherCurrent = {
  tempC: string
  feelsLikeC: string
  humidity: string
  pressure: string
  windKmph: string
  windDir: string
  visibility: string
  uvIndex: string
  precipMm: string
  desc: string
}

export type DetailedWeather = {
  cityLabel: string
  kind: WeatherKind
  current: DetailedWeatherCurrent
  /** Próximas entradas (wttr.in usa intervalos de ~3 h). */
  hourly: WeatherHourSlot[]
  hourlySourceNote: string
}

type WttrCurrent = {
  temp_C?: string
  FeelsLikeC?: string
  humidity?: string
  pressure?: string
  visibility?: string
  uvIndex?: string
  precipMM?: string
  windspeedKmph?: string
  winddir16Point?: string
  weatherCode?: string
  weatherDesc?: { value: string }[]
}

type WttrHourly = {
  time?: string
  tempC?: string
  FeelsLikeC?: string
  humidity?: string
  weatherDesc?: { value: string }[]
  windspeedKmph?: string
  winddir16Point?: string
  chanceofrain?: string
  precipMM?: string
  pressure?: string
}

type WttrDay = { date?: string; hourly?: WttrHourly[] }

type WttrArea = { areaName?: { value: string }[] }
type WttrJ1 = {
  nearest_area?: WttrArea[]
  current_condition?: WttrCurrent[]
  weather?: WttrDay[]
}

function s(v: string | undefined | null): string {
  const t = v?.trim()
  return t != null && t !== '' ? t : '—'
}

function cityFromWttr(data: WttrJ1): string {
  const name = data.nearest_area?.[0]?.areaName?.[0]?.value
  return name?.trim() || '—'
}

function tempFromWttr(data: WttrJ1): string {
  const t = data.current_condition?.[0]?.temp_C
  return t != null && t !== '' ? String(t) : '—'
}

type BaseSky =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunder'
  | 'unknown'

function baseKindFromCode(code: number): BaseSky {
  if ([386, 389, 392, 395].includes(code)) return 'thunder'
  if (
    [179, 227, 230, 323, 326, 329, 332, 335, 338, 350, 368, 371, 374, 377].includes(
      code,
    )
  )
    return 'snow'
  if (
    [
      176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 317, 320, 353,
      356, 359, 362, 365,
    ].includes(code)
  )
    return 'rain'
  if ([143, 248, 260].includes(code)) return 'fog'
  if (code === 122) return 'cloudy'
  if (code === 119) return 'cloudy'
  if (code === 116) return 'partly'
  if (code === 113) return 'clear'
  return 'unknown'
}

function baseKindFromDesc(desc: string): BaseSky | null {
  const d = desc.toLowerCase()
  if (d.includes('thunder')) return 'thunder'
  if (
    d.includes('snow') ||
    d.includes('blizzard') ||
    d.includes('sleet') ||
    d.includes('ice pellet')
  )
    return 'snow'
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower'))
    return 'rain'
  if (d.includes('fog') || d.includes('mist')) return 'fog'
  if (d.includes('overcast')) return 'cloudy'
  if (d.includes('partly') && d.includes('cloud')) return 'partly'
  if (d.includes('cloud')) return 'cloudy'
  if (d.includes('clear') || d.includes('sunny')) return 'clear'
  return null
}

function resolveBaseSky(cur: WttrCurrent | undefined): BaseSky {
  if (!cur) return 'unknown'
  const code = Number(cur.weatherCode)
  const desc = cur.weatherDesc?.[0]?.value ?? ''
  const fromDesc = baseKindFromDesc(desc)
  if (fromDesc) return fromDesc
  if (!Number.isFinite(code) || code <= 0) return 'unknown'
  return baseKindFromCode(code)
}

function applyNightVariant(base: BaseSky, hour: number): WeatherKind {
  const night = hour < 6 || hour >= 20
  if (base === 'clear') return night ? 'clear-night' : 'clear-day'
  if (base === 'partly') return night ? 'partly-night' : 'partly-day'
  if (base === 'cloudy') return 'cloudy'
  if (base === 'fog') return 'fog'
  if (base === 'rain') return 'rain'
  if (base === 'snow') return 'snow'
  if (base === 'thunder') return 'thunder'
  return 'unknown'
}

export function weatherKindFromWttr(data: WttrJ1): WeatherKind {
  const base = resolveBaseSky(data.current_condition?.[0])
  const hour = new Date().getHours()
  return applyNightVariant(base, hour)
}

function emptyWeather(): LocationWeather {
  return { cityLabel: '—', tempC: '—', kind: 'unknown' }
}

export function emptyDetailedWeather(): DetailedWeather {
  const dash = '—'
  return {
    cityLabel: dash,
    kind: 'unknown',
    current: {
      tempC: dash,
      feelsLikeC: dash,
      humidity: dash,
      pressure: dash,
      windKmph: dash,
      windDir: dash,
      visibility: dash,
      uvIndex: dash,
      precipMm: dash,
      desc: dash,
    },
    hourly: [],
    hourlySourceNote: '',
  }
}

function formatWttrClock(timeStr: string): string {
  const n = parseInt(timeStr, 10)
  if (!Number.isFinite(n)) return '—'
  const h = Math.floor(n / 100)
  const m = n % 100
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function slotLabel(dateStr: string, timeStr: string): string {
  const clock = formatWttrClock(timeStr)
  if (!dateStr) return clock
  try {
    const d = new Date(`${dateStr}T12:00:00`)
    const day = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d)
    return `${day} ${clock}`
  } catch {
    return clock
  }
}

function hourlySlotsFromWttr(wttr: WttrJ1, maxSlots: number): WeatherHourSlot[] {
  const days = wttr.weather ?? []
  const out: WeatherHourSlot[] = []
  for (const day of days) {
    const date = day.date ?? ''
    for (const h of day.hourly ?? []) {
      out.push({
        label: slotLabel(date, h.time ?? '0'),
        tempC: s(h.tempC),
        feelsLikeC: s(h.FeelsLikeC),
        humidity: s(h.humidity),
        desc: s(h.weatherDesc?.[0]?.value),
        windKmph: s(h.windspeedKmph),
        windDir: s(h.winddir16Point),
        chanceRain: s(h.chanceofrain),
      })
      if (out.length >= maxSlots) return out
    }
  }
  return out
}

function detailedWeatherFromWttr(wttr: WttrJ1, cityLabel: string): DetailedWeather {
  const cur = wttr.current_condition?.[0]
  return {
    cityLabel,
    kind: weatherKindFromWttr(wttr),
    current: {
      tempC: s(cur?.temp_C),
      feelsLikeC: s(cur?.FeelsLikeC),
      humidity: s(cur?.humidity),
      pressure: s(cur?.pressure),
      windKmph: s(cur?.windspeedKmph),
      windDir: s(cur?.winddir16Point),
      visibility: s(cur?.visibility),
      uvIndex: s(cur?.uvIndex),
      precipMm: s(cur?.precipMM),
      desc: s(cur?.weatherDesc?.[0]?.value),
    },
    hourly: hourlySlotsFromWttr(wttr, 16),
    hourlySourceNote:
      'Previsão por intervalos (~3 h) a partir dos dados wttr.in / WorldWeatherOnline.',
  }
}

function locationWeatherFromWttr(
  wttr: WttrJ1,
  cityLabel: string,
): LocationWeather {
  return {
    cityLabel,
    tempC: tempFromWttr(wttr),
    kind: weatherKindFromWttr(wttr),
  }
}

async function fetchWttr(path: string): Promise<WttrJ1> {
  const url = `https://wttr.in/${path}?format=j1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('wttr')
  return (await res.json()) as WttrJ1
}

async function reverseGeocodeCity(
  lat: number,
  lon: number,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    'accept-language': 'pt-BR',
  })
  const url = `https://nominatim.openstreetmap.org/reverse?${params}`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'pt-BR',
      'User-Agent': 'HomeBrowser/1.0 (Chrome extension; local dev)',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    address?: {
      city?: string
      town?: string
      village?: string
      municipality?: string
      county?: string
      state?: string
    }
  }
  const a = data.address
  const label =
    a?.city ||
    a?.town ||
    a?.village ||
    a?.municipality ||
    a?.county ||
    a?.state
  return label?.trim() || null
}

function getCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('no geolocation'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 12_000 },
    )
  })
}

async function loadWttrForUserPosition(): Promise<{ wttr: WttrJ1; city: string }> {
  try {
    const { lat, lon } = await getCoords()
    const locKey = `${lat},${lon}`

    const [wttr, nominatimCity] = await Promise.all([
      fetchWttr(locKey),
      reverseGeocodeCity(lat, lon).catch(() => null),
    ])

    const city = nominatimCity ?? cityFromWttr(wttr)
    return { wttr, city }
  } catch {
    const wttr = await fetchWttr('')
    return { wttr, city: cityFromWttr(wttr) }
  }
}

export type LocationWeatherBundle = {
  summary: LocationWeather
  detail: DetailedWeather
}

/**
 * Uma chamada à API — use isto na nova aba para alimentar o cabeçalho e o widget de tempo.
 */
export async function loadLocationWeatherBundle(): Promise<LocationWeatherBundle> {
  try {
    const { wttr, city } = await loadWttrForUserPosition()
    return {
      summary: locationWeatherFromWttr(wttr, city),
      detail: detailedWeatherFromWttr(wttr, city),
    }
  } catch {
    return {
      summary: emptyWeather(),
      detail: emptyDetailedWeather(),
    }
  }
}

export async function loadLocationWeather(): Promise<LocationWeather> {
  const b = await loadLocationWeatherBundle()
  return b.summary
}
