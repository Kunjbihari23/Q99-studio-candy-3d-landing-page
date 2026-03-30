import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF, Clone } from '@react-three/drei'
import ParticleBurst from '../../../systems/ParticleBurst'
import { useMicroMotion } from '../../../systems/useMicroMotion'

const ORBIT_RADIUS = 2.75

type PowerupKind = 'bomb' | 'rainbow' | 'rocket' | 'shield' | 'spark'

interface PowerupDef {
  id: PowerupKind
  color: string
  accent: string
  angle: number
}

interface BurstState {
  id: number
  position: [number, number, number]
}

const waveVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const waveFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered) * 2.0;
    float ring = smoothstep(uProgress + 0.14, uProgress, radius);
    float ripple = 0.5 + 0.5 * sin(radius * 18.0 - uTime * 6.0);
    vec3 colorA = vec3(1.0, 0.32, 0.66);
    vec3 colorB = vec3(0.34, 0.95, 1.0);
    vec3 rainbow = mix(colorA, colorB, 0.5 + 0.5 * sin(uTime * 2.0 + radius * 10.0));
    float alpha = ring * ripple * (1.0 - uProgress);
    gl_FragColor = vec4(rainbow, alpha * 0.88);
  }
`

const POWERUPS: PowerupDef[] = [
  { id: 'bomb', color: '#ff669f', accent: '#ffd9ea', angle: 0 },
  { id: 'rainbow', color: '#76e3ff', accent: '#fff5be', angle: 1.25 },
  { id: 'rocket', color: '#ffc776', accent: '#ffe8c8', angle: 2.52 },
  { id: 'shield', color: '#93ffb5', accent: '#dffff0', angle: 3.76 },
  { id: 'spark', color: '#c59aff', accent: '#f0e6ff', angle: 5.02 },
]

let burstId = 0
let waveId = 0
let rocketId = 0

const OrbitalPowerup = memo(
  ({
    item,
    scene,
    isActive,
    onSelect,
  }: {
    item: PowerupDef
    scene: THREE.Group
    isActive: boolean
    onSelect: (item: PowerupDef, position: [number, number, number]) => void
  }) => {
    const groupRef = useRef<THREE.Group>(null)
    const meshRef = useRef<THREE.Group>(null)
    const worldPositionRef = useRef(new THREE.Vector3())

    const microMotion = useMicroMotion({
      floatAmplitude: 0.1,
      floatSpeed: 1.4,
      hoverScale: 1.12,
      bounceStrength: 0.08,
      baseGlow: 0.12,
      hoverGlow: 0.2,
    })

    useFrame(({ clock }, delta) => {
      if (!isActive) return
      
      const group = groupRef.current
      const mesh = meshRef.current
      if (!group || !mesh) {
        return
      }

      const motion = microMotion.sample(clock.getElapsedTime(), delta)
      const baseY = Math.sin(item.angle * 1.7) * 0.45
      group.position.y = baseY + motion.floatOffset
      group.scale.setScalar(motion.scale)
      mesh.rotation.y += delta * 0.85
      mesh.rotation.x += delta * 0.35
    })

    return (
      <group
        ref={groupRef}
        position={[
          Math.cos(item.angle) * ORBIT_RADIUS,
          Math.sin(item.angle * 1.7) * 0.45,
          Math.sin(item.angle) * ORBIT_RADIUS,
        ]}
        onPointerOver={microMotion.handlePointerOver}
        onPointerOut={microMotion.handlePointerOut}
        onClick={(event) => {
          event.stopPropagation()
          microMotion.triggerBounce()
          event.object.getWorldPosition(worldPositionRef.current)
          onSelect(item, [
            worldPositionRef.current.x,
            worldPositionRef.current.y,
            worldPositionRef.current.z,
          ])
        }}
      >
        <group ref={meshRef} castShadow receiveShadow>
          <Clone object={scene} scale={1.2} />
        </group>
        <mesh scale={0.42}>
          <sphereGeometry args={[0.5, 18, 18]} />
          <meshBasicMaterial color={item.accent} transparent opacity={0.34} />
        </mesh>
      </group>
    )
  },
)

OrbitalPowerup.displayName = 'OrbitalPowerup'

const RainbowWave = ({ trigger, isActive }: { trigger: number; isActive: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const progressRef = useRef(2)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 1 },
    }),
    [],
  )

  useEffect(() => {
    if (trigger > 0) {
      progressRef.current = 0
      if (meshRef.current) {
        meshRef.current.visible = true
      }
    }
  }, [trigger])

  useFrame((_, delta) => {
    if (!isActive) return
    
    const material = materialRef.current
    const mesh = meshRef.current
    if (!material || !mesh) {
      return
    }

    material.uniforms.uTime.value += delta
    progressRef.current += delta * 0.72
    material.uniforms.uProgress.value = progressRef.current
    mesh.visible = progressRef.current < 1.2
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]} visible={false}>
      <ringGeometry args={[0.4, 4.4, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={waveVertexShader}
        fragmentShader={waveFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

const RocketDash = ({
  trigger,
  startPosition,
  isActive
}: {
  trigger: number
  startPosition: [number, number, number]
  isActive: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(2)

  useEffect(() => {
    if (trigger > 0) {
      progressRef.current = 0
      if (groupRef.current) {
        groupRef.current.visible = true
        groupRef.current.position.set(startPosition[0], startPosition[1], startPosition[2])
      }
    }
  }, [startPosition, trigger])

  useFrame((_, delta) => {
    if (!isActive) return
    
    const group = groupRef.current
    if (!group || !group.visible) {
      return
    }

    progressRef.current += delta * 0.7
    const t = progressRef.current
    group.position.x = THREE.MathUtils.lerp(startPosition[0], 6.4, t)
    group.position.y = startPosition[1] + Math.sin(t * Math.PI) * 0.7
    group.position.z = THREE.MathUtils.lerp(startPosition[2], -1.4, t)
    group.rotation.z = -0.8 + t * 0.5
    group.visible = t < 1
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <capsuleGeometry args={[0.14, 0.8, 6, 14]} />
        <meshPhysicalMaterial color="#ffcd78" emissive="#ff9e3d" emissiveIntensity={0.32} />
      </mesh>
      <mesh position={[-0.46, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.34, 14]} />
        <meshBasicMaterial color="#ff7c5e" />
      </mesh>
      <mesh position={[0.46, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.16, 0.42, 14]} />
        <meshBasicMaterial color="#7df2ff" transparent opacity={0.68} />
      </mesh>
    </group>
  )
}

const PowerupWorld = ({ activeIndex }: { activeIndex: number }) => {
  const orbitRef = useRef<THREE.Group>(null)
  const autoRotationRef = useRef(0)
  const scrollTargetRef = useRef(0)
  const [bursts, setBursts] = useState<BurstState[]>([])
  const [waveTrigger, setWaveTrigger] = useState(0)
  const [rocketTrigger, setRocketTrigger] = useState(0)
  const [rocketStart, setRocketStart] = useState<[number, number, number]>([0, 0, 0])

  const isActive = Math.abs(activeIndex - 3) < 0.95

  const { scene: bombScene } = useGLTF('/Glb-Models/red_candy_monster.glb')
  const { scene: rainbowScene } = useGLTF('/Glb-Models/Color_Full_Candy.glb')
  const { scene: rocketScene } = useGLTF('/Glb-Models/candy_stick.glb')
  const { scene: shieldScene } = useGLTF('/Glb-Models/candy_model_green.glb')
  const { scene: sparkScene } = useGLTF('/Glb-Models/candy_pink.glb')

  useEffect(() => {
    const onScroll = () => {
      scrollTargetRef.current = window.scrollY * 0.0028
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSelect = useCallback((item: PowerupDef, position: [number, number, number]) => {
    if (item.id === 'bomb') {
      burstId += 1
      const nextBurst = { id: burstId, position }
      setBursts((current) => [...current, nextBurst])
      window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => burst.id !== nextBurst.id))
      }, 1000)
      return
    }

    if (item.id === 'rainbow') {
      waveId += 1
      setWaveTrigger(waveId)
      return
    }

    if (item.id === 'rocket') {
      rocketId += 1
      setRocketStart(position)
      setRocketTrigger(rocketId)
    }
  }, [])

  useFrame((_, delta) => {
    if (!isActive) return
    
    const orbit = orbitRef.current
    if (!orbit) {
      return
    }

    autoRotationRef.current += delta * 0.28
    const targetRotation = autoRotationRef.current + scrollTargetRef.current
    orbit.rotation.y = THREE.MathUtils.damp(orbit.rotation.y, targetRotation, 3.8, delta)
    orbit.rotation.x = THREE.MathUtils.damp(
      orbit.rotation.x,
      Math.sin(targetRotation * 0.35) * 0.18,
      2.4,
      delta,
    )

    orbit.rotation.y += delta * 3
  })

  return (
    <group>
      <ambientLight intensity={0.72} />
      <hemisphereLight intensity={0.64} color="#ffe4f6" groundColor="#18071f" />
      <directionalLight position={[4, 7, 5]} intensity={1.35} color="#ffffff" />
      <pointLight position={[-3, 1, 4]} intensity={10} distance={15} color="#68e4ff" />
      <pointLight position={[3, 1, 4]} intensity={10} distance={15} color="#ff74c6" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <circleGeometry args={[4.1, 64]} />
        <meshBasicMaterial color="#17071f" transparent opacity={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <ringGeometry args={[1.6, 3.85, 96]} />
        <meshBasicMaterial color="#7de8ff" transparent opacity={0.16} />
      </mesh>

      <group ref={orbitRef}>
        <mesh castShadow receiveShadow>
          <octahedronGeometry args={[0.72, 1]} />
          <meshPhysicalMaterial
            color="#ffe38a"
            emissive="#ff7a9a"
            emissiveIntensity={0.22}
            roughness={0.2}
            metalness={0.08}
            clearcoat={1}
            transmission={0.08}
          />
        </mesh>

        {POWERUPS.map((item) => {
           let s = sparkScene;
           if (item.id === 'bomb') s = bombScene;
           if (item.id === 'rainbow') s = rainbowScene;
           if (item.id === 'rocket') s = rocketScene;
           if (item.id === 'shield') s = shieldScene;

           return (
             <OrbitalPowerup 
                key={item.id} 
                item={item} 
                scene={s} 
                isActive={isActive}
                onSelect={handleSelect} 
             />
           )
        })}
      </group>

      <RainbowWave trigger={waveTrigger} isActive={isActive} />
      <RocketDash trigger={rocketTrigger} startPosition={rocketStart} isActive={isActive} />

      {bursts.map((burst) => (
        <ParticleBurst key={burst.id} position={burst.position} color="#ffdca8" count={40} />
      ))}
    </group>
  )
}

export default PowerupWorld
