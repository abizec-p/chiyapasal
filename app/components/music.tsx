"use client";
import { useEffect, useRef, useState } from "react";
import { FaPlay, FaPause, FaMusic, FaOm } from "react-icons/fa";
import { MdSkipPrevious, MdSkipNext } from "react-icons/md";
import { PiBirdBold } from "react-icons/pi";
import { IoMdRadio } from "react-icons/io";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Station =
  | {
      name: string;
      icon: any;
      type: "local";
      tracks: { src: string; title: string }[];
    }
  | { name: string; icon: any; type: "youtube"; playlistId: string };

const stations: Station[] = [
  
  {
    name: "Music",
    icon: FaMusic,
    type: "youtube",
    playlistId: "PLHrgE17eU8XU",
  },
  {
    name: "Radio",
    icon: IoMdRadio,
    type: "local",
    tracks: [
      { src: "/radio/radio1.mp3", title: "Radio nepal baal karyakram" },
      { src: "/radio/radio2.mp3", title: "Ujyalo Fm Bihana ko khabar" },
    ],
  },
  {
    name: "Bhajan",
    icon: FaOm,
    type: "local",
    tracks: [
      { src: "/bhajan/bhajan1.mp3", title: "Radio Nepal bihani Bhajan" },
      { src: "/bhajan/bhajan2.mp3", title: "Aarati ko bela vayo" },
    ],
  },
  {
    name: "Chill",
    icon: PiBirdBold,
    type: "local",
    tracks: [{ src: "/chill/chill1.mp3", title: "Birds and village sound" }],
  },
];

const ytStation = stations.find((s) => s.type === "youtube") as Extract<
  Station,
  { type: "youtube" }
>;

export default function Music() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytBoxRef = useRef<HTMLDivElement>(null);
  const ytRef = useRef<any>(null);
  const isYtRef = useRef(false);

  const [active, setActive] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ytTitle, setYtTitle] = useState("Press play");

  const station = stations[active];
  const isYt = station.type === "youtube";
  const ActiveIcon = station.icon;

  // YouTube player: created once, only used by the Music station
  useEffect(() => {
    const create = () => {
      if (!ytBoxRef.current) return;
      const el = document.createElement("div");
      ytBoxRef.current.appendChild(el);

      ytRef.current = new window.YT.Player(el, {
        width: "1",
        height: "1",
        playerVars: { playsinline: 1 },
        events: {
          onReady: () => {
            ytRef.current.cuePlaylist({
              listType: "playlist",
              list: ytStation.playlistId,
            });
          },
          onStateChange: (e: any) => {
            if (!isYtRef.current) return;
            if (e.data === 1) {
              setPlaying(true);
              setYtTitle(ytRef.current?.getVideoData?.().title || "Playing");
            }
            if (e.data === 2) setPlaying(false);
          },
          onError: (e: any) => console.log("YT error:", e.data),
        },
      });
    };

    if (window.YT?.Player) {
      create();
    } else {
      window.onYouTubeIframeAPIReady = create;
      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        )
      ) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }

    return () => {
      ytRef.current?.destroy?.();
      ytRef.current = null;
      if (ytBoxRef.current) ytBoxRef.current.innerHTML = "";
    };
  }, []);

  useEffect(() => {
    if (!playing || !isYt) return;
    const id = setInterval(() => {
      const p = ytRef.current;
      const d = p?.getDuration?.();
      if (d > 0) setProgress((p.getCurrentTime() / d) * 100);
    }, 500);
    return () => clearInterval(id);
  }, [playing, isYt]);

  const playLocal = (st: Extract<Station, { type: "local" }>, i: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const n = (i + st.tracks.length) % st.tracks.length;
    setTrackIndex(n);
    setProgress(0);
    audio.src = st.tracks[n].src;
    audio.play();
  };

  const switchStation = (i: number) => {
    const next = stations[i];
    audioRef.current?.pause();
    ytRef.current?.pauseVideo?.();

    isYtRef.current = next.type === "youtube";
    setActive(i);
    setTrackIndex(0);
    setProgress(0);
    setPlaying(false);

    if (next.type === "local") playLocal(next, 0);
    else ytRef.current?.playVideo?.();
  };

  const toggle = () => {
    if (station.type === "youtube") {
      if (playing) ytRef.current?.pauseVideo();
      else ytRef.current?.playVideo();
    } else {
      const a = audioRef.current;
      if (!a) return;
      if (a.paused) {
        if (!a.src) playLocal(station, trackIndex);
        else a.play();
      } else a.pause();
    }
  };

  const step = (dir: 1 | -1) => {
    if (station.type === "local") {
      playLocal(station, trackIndex + dir);
    } else {
      const p = ytRef.current;
      const list = p?.getPlaylist?.();
      if (!list || list.length === 0) return;
      p.playVideoAt((p.getPlaylistIndex() + dir + list.length) % list.length);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (station.type === "youtube") {
      const d = ytRef.current?.getDuration?.();
      if (d > 0) {
        ytRef.current.seekTo(ratio * d, true);
        setProgress(ratio * 100);
      }
    } else {
      const a = audioRef.current;
      if (a?.duration) a.currentTime = ratio * a.duration;
    }
  };

  const title =
    station.type === "local" ? station.tracks[trackIndex].title : ytTitle;

  return (
    <>
      <audio
        ref={audioRef}
        onPlay={() => !isYtRef.current && setPlaying(true)}
        onPause={() => !isYtRef.current && setPlaying(false)}
        onEnded={() =>
          station.type === "local" && playLocal(station, trackIndex + 1)
        }
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          if (!isYtRef.current && a.duration)
            setProgress((a.currentTime / a.duration) * 100);
        }}
      />

      <div className="absolute bottom-35 left-1/2 z-50 flex w-[92vw] max-w-150 -translate-x-1/2 flex-col items-center gap-3 md:bottom-30 mt-5">
        <div
          ref={ytBoxRef}
          className={
            isYt
              ? "overflow-hidden rounded-2xl shadow-xl"
              : "h-0 w-0 overflow-hidden"
          }
        />

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
              <p className="mt-1 text-xs text-white/50">{station.name}</p>
            </div>
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
          </div>

          <div className="flex shrink-0 items-center gap-1  md:gap-2">
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
