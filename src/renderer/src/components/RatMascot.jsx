import { useEffect, useRef, useState } from 'react'
import ratMain from '../assets/rat_main.png'
import ratCalendar from '../assets/rat_calendar.png'

const CSS = `
  @keyframes rat-bob {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }

  @keyframes rat-bounce {
    0%   { transform: translateY(0px)   rotate(0deg);  }
    20%  { transform: translateY(-22px) rotate(-8deg); }
    40%  { transform: translateY(-10px) rotate(6deg);  }
    60%  { transform: translateY(-18px) rotate(-4deg); }
    80%  { transform: translateY(-4px)  rotate(2deg);  }
    100% { transform: translateY(0px)   rotate(0deg);  }
  }

  /* scaleX is applied after translate in the matrix, so the translate direction
     is flipped for rtl — positive X in local space becomes negative X on screen.
     Both animations start off-screen and end off-screen on the opposite side. */
  @keyframes rat-run-ltr {
    0%   { transform: scaleX(1) translate(0vw,    0px);  }
    10%  { transform: scaleX(1) translate(11vw,  -7px);  }
    20%  { transform: scaleX(1) translate(22vw,   0px);  }
    30%  { transform: scaleX(1) translate(33vw,  -7px);  }
    40%  { transform: scaleX(1) translate(44vw,   0px);  }
    50%  { transform: scaleX(1) translate(55vw,  -7px);  }
    60%  { transform: scaleX(1) translate(66vw,   0px);  }
    70%  { transform: scaleX(1) translate(77vw,  -7px);  }
    80%  { transform: scaleX(1) translate(88vw,   0px);  }
    90%  { transform: scaleX(1) translate(99vw,  -7px);  }
    100% { transform: scaleX(1) translate(115vw,  0px);  }
  }

  @keyframes rat-run-rtl {
    0%   { transform: scaleX(-1) translate(0vw,    0px);  }
    10%  { transform: scaleX(-1) translate(11vw,  -7px);  }
    20%  { transform: scaleX(-1) translate(22vw,   0px);  }
    30%  { transform: scaleX(-1) translate(33vw,  -7px);  }
    40%  { transform: scaleX(-1) translate(44vw,   0px);  }
    50%  { transform: scaleX(-1) translate(55vw,  -7px);  }
    60%  { transform: scaleX(-1) translate(66vw,   0px);  }
    70%  { transform: scaleX(-1) translate(77vw,  -7px);  }
    80%  { transform: scaleX(-1) translate(88vw,   0px);  }
    90%  { transform: scaleX(-1) translate(99vw,  -7px);  }
    100% { transform: scaleX(-1) translate(115vw,  0px);  }
  }

  .rat-corner {
    position: fixed;
    bottom: 18px;
    right: 18px;
    width: 90px;
    height: auto;
    pointer-events: none;
    z-index: 9999;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
    animation: rat-bob 2.4s ease-in-out infinite;
  }
  .rat-corner.bouncing {
    animation: rat-bounce 0.8s ease-in-out forwards;
  }

  /* Runner: left:-90px for ltr, right:-90px for rtl */
  .rat-runner {
    position: fixed;
    bottom: 18px;
    width: 90px;
    height: auto;
    pointer-events: none;
    z-index: 9999;
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));
  }
  .rat-runner.ltr {
    left: -90px;
    animation: rat-run-ltr 3s linear forwards;
  }
  .rat-runner.rtl {
    right: -90px;
    animation: rat-run-rtl 3s linear forwards;
  }
`

export default function RatMascot({ page, bouncing }) {
  const src = page === 'calendar' ? ratCalendar : ratMain
  const [isBouncing, setIsBouncing] = useState(false)
  const [runDir, setRunDir] = useState(null)   // null | 'ltr' | 'rtl'

  const mountedRef   = useRef(false)
  const bounceTimer  = useRef(null)
  const runTimer     = useRef(null)
  const runEndTimer  = useRef(null)

  // Bounce on task complete (ignore initial mount)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setIsBouncing(true)
    clearTimeout(bounceTimer.current)
    bounceTimer.current = setTimeout(() => setIsBouncing(false), 800)
  }, [bouncing])

  // Schedule random runs every 30-60 seconds
  useEffect(() => {
    function scheduleRun() {
      const delay = 30_000 + Math.random() * 30_000
      runTimer.current = setTimeout(() => {
        const dir = Math.random() < 0.5 ? 'ltr' : 'rtl'
        setRunDir(dir)
        runEndTimer.current = setTimeout(() => {
          setRunDir(null)
          scheduleRun()
        }, 3200)   // slightly after animation ends (3 s)
      }, delay)
    }
    scheduleRun()
    return () => {
      clearTimeout(runTimer.current)
      clearTimeout(runEndTimer.current)
      clearTimeout(bounceTimer.current)
    }
  }, [])

  return (
    <>
      <style>{CSS}</style>

      {runDir ? (
        <img
          key={`run-${runDir}`}
          src={src}
          alt=""
          className={`rat-runner ${runDir}`}
        />
      ) : (
        <img
          src={src}
          alt=""
          className={`rat-corner${isBouncing ? ' bouncing' : ''}`}
        />
      )}
    </>
  )
}
