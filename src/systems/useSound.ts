import { useCallback } from 'react'

interface SoundOptions {
  enabled?: boolean
  volume?: number
}

interface ToneSettings {
  type: OscillatorType
  startFrequency: number
  endFrequency: number
  duration: number
  gain: number
  detune?: number
}

interface NoiseSettings {
  duration: number
  gain: number
  highpass: number
}

interface SoundContext {
  context: AudioContext
  masterGain: GainNode
  noiseBuffer: AudioBuffer
}

let sharedContext: AudioContext | null = null
let sharedMasterGain: GainNode | null = null
let sharedNoiseBuffer: AudioBuffer | null = null

const createNoiseBuffer = (context: AudioContext) => {
  const duration = 0.25
  const frameCount = Math.floor(context.sampleRate * duration)
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }

  return buffer
}

const playTone = (
  context: AudioContext,
  destination: AudioNode,
  settings: ToneSettings,
) => {
  const startTime = context.currentTime
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = settings.type
  oscillator.frequency.setValueAtTime(settings.startFrequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(40, settings.endFrequency),
    startTime + settings.duration,
  )

  if (settings.detune) {
    oscillator.detune.setValueAtTime(settings.detune, startTime)
  }

  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.linearRampToValueAtTime(
    settings.gain,
    startTime + Math.min(0.02, settings.duration * 0.2),
  )
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + settings.duration,
  )

  oscillator.connect(gainNode)
  gainNode.connect(destination)

  oscillator.start(startTime)
  oscillator.stop(startTime + settings.duration)
  oscillator.onended = () => {
    oscillator.disconnect()
    gainNode.disconnect()
  }
}

const playNoise = (
  context: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  settings: NoiseSettings,
) => {
  const startTime = context.currentTime
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gainNode = context.createGain()

  source.buffer = buffer

  filter.type = 'highpass'
  filter.frequency.setValueAtTime(settings.highpass, startTime)

  gainNode.gain.setValueAtTime(settings.gain, startTime)
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + settings.duration,
  )

  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(destination)

  source.start(startTime)
  source.stop(startTime + settings.duration)
  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gainNode.disconnect()
  }
}

export const useSound = ({ enabled = true, volume = 0.2 }: SoundOptions = {}) => {
  
  const resume = useCallback((): SoundContext | null => {
    if (!enabled || typeof window === 'undefined') {
      return null
    }

    if (!sharedContext || !sharedMasterGain) {
      // Use any for vendor prefix check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return null;

      sharedContext = new AudioContextClass()
      sharedMasterGain = sharedContext.createGain()
      sharedMasterGain.connect(sharedContext.destination)
      sharedNoiseBuffer = createNoiseBuffer(sharedContext)
    }

    const context = sharedContext
    const masterGain = sharedMasterGain

    if (!context || !masterGain) {
      return null
    }

    if (context.state === 'suspended') {
      void context.resume()
    }

    masterGain.gain.setTargetAtTime(volume, context.currentTime, 0.05)

    if (sharedNoiseBuffer === null) {
      sharedNoiseBuffer = createNoiseBuffer(context)
    }

    return {
      context,
      masterGain,
      noiseBuffer: sharedNoiseBuffer,
    }
  }, [enabled, volume])

  const playPop = useCallback(() => {
    const sound = resume()
    if (!sound) return

    playTone(sound.context, sound.masterGain, {
      type: 'triangle',
      startFrequency: 720,
      endFrequency: 220,
      duration: 0.12,
      gain: 0.18,
      detune: 8,
    })

    playNoise(sound.context, sound.masterGain, sound.noiseBuffer, {
      duration: 0.05,
      gain: 0.035,
      highpass: 1400,
    })
  }, [resume])

  const playBurst = useCallback(() => {
    const sound = resume()
    if (!sound) return

    playTone(sound.context, sound.masterGain, {
      type: 'sawtooth',
      startFrequency: 260,
      endFrequency: 90,
      duration: 0.24,
      gain: 0.16,
    })

    playTone(sound.context, sound.masterGain, {
      type: 'square',
      startFrequency: 520,
      endFrequency: 160,
      duration: 0.18,
      gain: 0.08,
      detune: 12,
    })

    playNoise(sound.context, sound.masterGain, sound.noiseBuffer, {
      duration: 0.12,
      gain: 0.06,
      highpass: 900,
    })
  }, [resume])

  return {
    playPop,
    playBurst,
    resume
  }
}
