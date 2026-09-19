import { useEffect, useRef } from "react"
import * as THREE from "three"

// Malla 3D de la superficie de correlación, leyendo la misma imagen que ya envía el backend como heightmap.

interface CorrelationSurface3DProps {
  /** Imagen del pico de correlación ya codificada por el backend, con el prefijo data URI. */
  src: string
}

const GRID_SIZE = 64
const HEIGHT_SCALE = 12

export function CorrelationSurface3D({ src }: CorrelationSurface3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cancelled = false
    let renderer: THREE.WebGLRenderer | undefined
    let geometry: THREE.PlaneGeometry | undefined
    let material: THREE.MeshStandardMaterial | undefined
    let animationId: number | undefined
    let cleanupListeners: (() => void) | undefined

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // El componente puede haberse desmontado mientras la imagen cargaba.
      if (cancelled) return

      const sampleCanvas = document.createElement("canvas")
      sampleCanvas.width = GRID_SIZE
      sampleCanvas.height = GRID_SIZE
      const ctx = sampleCanvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE)
      const { data } = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE)

      const width = container.clientWidth || 1
      const height = container.clientHeight || 1

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0e0e0e)

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
      camera.position.set(0, 20, 26)
      camera.lookAt(0, 0, 0)

      geometry = new THREE.PlaneGeometry(20, 20, GRID_SIZE - 1, GRID_SIZE - 1)
      const positions = geometry.attributes.position
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        // Imagen en escala de grises: R === G === B, el canal R alcanza.
        const gray = data[i * 4] / 255
        positions.setZ(i, gray * HEIGHT_SCALE)
      }
      positions.needsUpdate = true
      geometry.computeVertexNormals()

      material = new THREE.MeshStandardMaterial({ color: 0x34d399 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2.3
      scene.add(mesh)

      scene.add(new THREE.AmbientLight(0x404040, 1.5))
      const light = new THREE.DirectionalLight(0xffffff, 1.2)
      light.position.set(10, 20, 10)
      scene.add(light)

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      container.innerHTML = ""
      container.appendChild(renderer.domElement)

      // Rotación manual por arrastre (sin OrbitControls, para no sumar otra dependencia).
      let isDragging = false
      let lastX = 0
      let rotationZ = 0
      const onPointerDown = (e: PointerEvent) => {
        isDragging = true
        lastX = e.clientX
      }
      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return
        rotationZ += (e.clientX - lastX) * 0.01
        lastX = e.clientX
      }
      const onPointerUp = () => {
        isDragging = false
      }
      renderer.domElement.addEventListener("pointerdown", onPointerDown)
      window.addEventListener("pointermove", onPointerMove)
      window.addEventListener("pointerup", onPointerUp)
      cleanupListeners = () => {
        renderer?.domElement.removeEventListener("pointerdown", onPointerDown)
        window.removeEventListener("pointermove", onPointerMove)
        window.removeEventListener("pointerup", onPointerUp)
      }

      const animate = () => {
        mesh.rotation.z = rotationZ
        renderer?.render(scene, camera)
        animationId = requestAnimationFrame(animate)
      }
      animate()
    }
    img.src = src

    return () => {
      cancelled = true
      if (animationId !== undefined) cancelAnimationFrame(animationId)
      cleanupListeners?.()
      renderer?.dispose()
      geometry?.dispose()
      material?.dispose()
      if (container) container.innerHTML = ""
    }
  }, [src])

  return <div ref={containerRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
}
