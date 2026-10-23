"use client";
import { useRef, useState } from "react";
import { FaPlay, FaPause, FaMusic, FaOm,  } from "react-icons/fa";
import { MdSkipPrevious, MdSkipNext } from "react-icons/md";
import { PiBirdBold } from "react-icons/pi";
import { IoMdRadio } from "react-icons/io";

type Station =
  | {
      name: string;
      icon: any;
      type: "local";
      tracks: { src: string; title: string }[];
    }
  | { name: string; icon: any; type: "live" };

type RadioStation = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  tags: string;
};

const stations: Station[] = [
  {
    name: "Nearby",
    icon: IoMdRadio,
    type: "live",
  },
  {
    name: "Traditional Nepali Music",
    icon: FaMusic,
    type: "local",
    tracks: [
      { src: "/music/nep1.mp3", title: "Nepali music by Surya_2050" },
      { src: "/music/nep2.mp3", title: "Traditional music by Surya_2050" },
      { src: "/music/nep3.mp3", title: "Nepali Flute music by Surya_2050" },
    ],
  },

  {
    name: "Bhajan",
    icon: FaOm,
    type: "local",
    tracks: [
      { src: "/music/bhajan1.mp3", title: "Radio Nepal bihani Bhajan" },
      { src: "/music/bhajan1.mp3", title: "Radio Nepal bihani Bhajan" },
      { src: "/music/bhajan2.mp3", title: "Bhajan Playlist" },
      { src: "/music/bhajan3.mp3", title: "Morning Bhajan" },
      { src: "/music/bhajan4.mp3", title: "Enjoy this beautiful bhajan" },
      { src: "/music/bhajan5.mp3", title: "Bhajan kirtan" },
    ],
  },
  {
    name: "Chill",
    icon: PiBirdBold,
    type: "local",
    tracks: [{ src: "/music/bg-music", title: "Birds and village sound" }],
  },
  
];


const RADIO_API = "https://de1.api.radio-browser.info/json";
const FALLBACK_COUNTRY = "CA"; 

const onlyHttps = (list: RadioStation[]) =>
  list.filter((s) => s.url_resolved?.startsWith("https://"));

async function fetchNearby(lat: number, lng: number, radiusKm = 100) {
  const params = new URLSearchParams({
    geo_lat: String(lat),
    geo_long: String(lng),
    geo_distance: String(radiusKm * 1000),
    has_geo_info: "true",
    hidebroken: "true",
    order: "votes",
    reverse: "true",
    limit: "60",
  });
  const res = await fetch(`${RADIO_API}/stations/search?${params}`);
  if (!res.ok) throw new Error("Radio lookup failed");
  return onlyHttps(await res.json());
}

async function fetchByCountry(code: string) {
  const res = await fetch(
    `${RADIO_API}/stations/bycountrycodeexact/${code}?hidebroken=true&order=votes&reverse=true&limit=60`,
  );
  if (!res.ok) throw new Error("Radio lookup failed");
  return onlyHttps(await res.json());
}

const registerClick = (uuid: string) => {
  fetch(`${RADIO_API}/url/${uuid}`).catch(() => {});
};

const getPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("No geolocation"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
    });
  });

/* ---------- Component ---------- */

export default function Music() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef(0); // lets async radio loading know if user switched away

  const [active, setActive] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // radio state
  const [radioList, setRadioList] = useState<RadioStation[]>([]);
  const [radioIndex, setRadioIndex] = useState(0);
  const [radioLoading, setRadioLoading] = useState(false);
  const [radioNote, setRadioNote] = useState("");
  const [streamError, setStreamError] = useState(false);

  const station = stations[active];
  const isLive = station.type === "live";
  const ActiveIcon = station.icon;

  const playLocal = (st: Extract<Station, { type: "local" }>, i: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const n = (i + st.tracks.length) % st.tracks.length;
    setTrackIndex(n);
    setProgress(0);
    audio.src = st.tracks[n].src;
    audio.play();
  };

  const playRadio = (list: RadioStation[], i: number) => {
    const audio = audioRef.current;
    if (!audio || list.length === 0) return;
    const n = (i + list.length) % list.length;
    setRadioIndex(n);
    setStreamError(false);
    audio.src = list[n].url_resolved;
    audio.play().catch(() => {});
    registerClick(list[n].stationuuid);
  };

  const loadRadio = async (): Promise<RadioStation[]> => {
    setRadioLoading(true);
    setRadioNote("");
    let list: RadioStation[] = [];

    try {
      const { coords } = await getPosition();
      list = await fetchNearby(coords.latitude, coords.longitude);
      if (list.length >= 5) {
        setRadioNote("Near you");
      } else {
        list = [];
      }
    } catch {
      list = [];
    }

    if (list.length === 0) {
      try {
        list = await fetchByCountry(FALLBACK_COUNTRY);
        setRadioNote("Popular stations");
      } catch {
        setRadioNote("Couldn't load stations");
      }
    }

    setRadioList(list);
    setRadioLoading(false);
    return list;
  };

  const switchStation = async (i: number) => {
    const next = stations[i];
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src"); 
      audio.load();
    }

    activeRef.current = i;
    setActive(i);
    setTrackIndex(0);
    setProgress(0);
    setPlaying(false);
    setStreamError(false);

    if (next.type === "local") {
      playLocal(next, 0);
    } else {
      const list = radioList.length ? radioList : await loadRadio();
      if (activeRef.current !== i) return; // user switched away while loading
      playRadio(list, 0);
    }
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;

    if (station.type === "live") {
      if (radioLoading) return;
      if (a.paused) {
        if (!a.src) playRadio(radioList, radioIndex);
        else a.play().catch(() => {});
      } else {
        a.pause();
      }
      return;
    }

    if (a.paused) {
      if (!a.src) playLocal(station, trackIndex);
      else a.play();
    } else {
      a.pause();
    }
  };

  const step = (dir: 1 | -1) => {
    if (station.type === "local") {
      playLocal(station, trackIndex + dir);
    } else if (!radioLoading) {
      playRadio(radioList, radioIndex + dir);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (station.type === "live") return; // live streams can't be seeked
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const a = audioRef.current;
    if (a?.duration) a.currentTime = ratio * a.duration;
  };

  let title: string;
  if (station.type === "local") {
    title = station.tracks[trackIndex].title;
  } else if (radioLoading) {
    title = "Finding stations near you…";
  } else if (streamError) {
    title = "Stream unavailable, press next";
  } else {
    title = radioList[radioIndex]?.name || "Press radio - Find stations near you";
  }

  const subtitle =
    station.type === "live" && radioNote
      ? `${station.name} · ${radioNote}`
      : station.name;

  return (
    <>
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() =>
          station.type === "local" && playLocal(station, trackIndex + 1)
        }
        onError={() => {
          if (station.type === "live") {
            setPlaying(false);
            setStreamError(true);
          }
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (station.type === "local" && isFinite(a.duration) && a.duration)
            setProgress((a.currentTime / a.duration) * 100);
        }}
      />

      <div className="absolute bottom-20 left-1/2 z-50 flex w-[92vw] max-w-150 -translate-x-1/2 flex-col items-center gap-3 md:bottom-30 mt-5">
        <div className="flex gap-3 text-sm md:gap-4">
          {stations.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.name}
                onClick={() => switchStation(i)}
                title={s.name}
                aria-label={s.name}
                className={`rounded-full p-3 transition ${
                  active === i ? "bg-white" : "bg-white/70 md:hover:bg-white/90"
                }`}
              >
                <Icon />
              </button>
            );
          })}
        </div>

        <div className="flex w-full items-center gap-3 mt-3 rounded-full bg-white/10 p-3 text-white backdrop-blur md:gap-4 md:p-4">
          <div className="shrink-0 rounded-full bg-black p-4 md:p-6">
            <ActiveIcon />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 md:gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm leading-none md:text-base">
                {title}
              </div>
              <p className="mt-1 truncate text-xs text-white/50">{subtitle}</p>
            </div>

            {isLive ? (
              <div className="flex h-3 items-center gap-2 text-xs text-white/60">
                <span
                  className={`h-2 w-2 rounded-full bg-red-500 ${
                    playing ? "animate-pulse" : "opacity-40"
                  }`}
                />
                LIVE
              </div>
            ) : (
              <div
                onClick={seek}
                className="flex h-3 w-full cursor-pointer items-center"
              >
                <div className="h-1 w-full rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <button onClick={() => step(-1)} aria-label="Previous">
              <MdSkipPrevious className="text-2xl" />
            </button>
            <button
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="rounded-full bg-white/90 p-3 text-black/80 md:p-4"
            >
              {playing ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={() => step(1)} aria-label="Next">
              <MdSkipNext className="text-2xl" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}