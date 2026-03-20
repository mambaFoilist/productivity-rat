import { useEffect, useRef } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils, getSnapshot, loadSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

export default function Blackboard() {
  const storeRef = useRef(null)

  if (!storeRef.current) {
    storeRef.current = createTLStore({ shapeUtils: defaultShapeUtils })
  }

  useEffect(() => {
    const store = storeRef.current

    window.api.getBoard().then(snapshot => {
      if (snapshot) {
        try {
          loadSnapshot(store, snapshot)
        } catch (e) {
          console.error('Failed to load board snapshot', e)
        }
      }
    })

    const interval = setInterval(() => {
      const snapshot = getSnapshot(store)
      window.api.setBoard(snapshot)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, left: '200px' }}>
      <Tldraw store={storeRef.current} />
    </div>
  )
}
