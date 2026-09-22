import { create } from 'zustand'

type AudioBusState = {
  activeCount: number
  exclusiveCount: number
  startExclusive: () => void
  endExclusive: () => void
  startEffect: () => void
  endEffect: () => void
}

export const useAudioBus = create<AudioBusState>((set, get) => ({
  activeCount: 0,
  exclusiveCount: 0,
  startExclusive: () => set({ exclusiveCount: get().exclusiveCount + 1 }),
  endExclusive: () => set({ exclusiveCount: Math.max(0, get().exclusiveCount - 1) }),
  startEffect: () => set({ activeCount: get().activeCount + 1 }),
  endEffect: () => {
    const n = get().activeCount - 1
    set({ activeCount: n < 0 ? 0 : n })
  },
}))
