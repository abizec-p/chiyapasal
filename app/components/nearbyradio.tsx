
"use client";

import { useEffect, useState } from "react";

type Station = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  codec?: string;
  lastcheckok?: number;
};

export default function NearbyRadio() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStation, setSelectedStation] =
    useState<Station | null>(null);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    async function loadStations() {
      try {
        const res = await fetch(
          "https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/CA?hidebroken=true&order=votes&reverse=true&limit=20"
        );

        if (!res.ok) {
          throw new Error("API request failed");
        }

        const data: Station[] = await res.json();
        setStations(data);
      } catch (err) {
        console.error(err);
        setError("Couldn't load stations.");
      } finally {
        setLoading(false);
      }
    }

    loadStations();
  }, []);

  if (loading) return <p>Loading stations...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Canadian Radio Stations</h2>

      <ul>
        {stations.map((s) => (
          <li key={s.stationuuid}>
            <button
              onClick={() => {
                setPlayError("");
                setSelectedStation(s);
              }}
            >
              {s.name}
            </button>
            {s.codec && <small> ({s.codec})</small>}
          </li>
        ))}
      </ul>

      {selectedStation && (
        <div>
          <h3>Now playing: {selectedStation.name}</h3>

          <audio
            key={selectedStation.stationuuid}
            controls
            autoPlay
            preload="none"
            src={selectedStation.url_resolved}
            onError={() =>
              setPlayError(
                "This station could not be played. Try another station."
              )
            }
          />

          {playError && <p>{playError}</p>}
        </div>
      )}
    </div>
  );
}
