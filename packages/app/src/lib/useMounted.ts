// Prevent hydration errors, address scroll restoration, and prevent back button page re-renders.
// ref: https://github.com/vercel/next.js/discussions/17443#discussioncomment-739583

import { useEffect, useRef } from 'react'
import { useUpdate } from 'react-use'

export default function useMounted() {
  const mounted = useRef(false)
  // useUpdate forces a re-render when called
  // ref: https://github.com/streamich/react-use/blob/master/docs/useUpdate.md
  const update = useUpdate()
  useEffect(() => {
    if (mounted.current == false) {
      mounted.current = true
      update()
    }
  }, [update])
  return mounted.current
}
