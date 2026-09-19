import { Route, Routes, useLocation, useNavigate } from "react-router-dom"
import { NavDrawer } from "@/components/rack/NavDrawer"
import { Landing } from "./sections/Landing"
import { Modulo1 } from "./sections/modulo-1/Modulo1"
import { Section2 } from "./sections/modulo-1/Section2"
import { Modulo2 } from "./sections/modulo-2/Modulo2"
import { Section2 as Modulo2Section2 } from "./sections/modulo-2/Section2"
import { Modulo3 } from "./sections/modulo-3/Modulo3"
import { Section2 as Modulo3Section2 } from "./sections/modulo-3/Section2"

// `value` es el segmento de ruta real de cada módulo (dominio/modulo-1, etc.).
const MODULES = [
  { value: "modulo-1", label: "MOD 01 · EVM" },
  { value: "modulo-2", label: "MOD 02 · 2D-FFT" },
  { value: "modulo-3", label: "MOD 03 · PHASE" },
]

// Contenedor de scroll único con scroll-snap: módulo activo (según la ruta) + Steps de Section2.
function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeModule = location.pathname === "/" ? "" : location.pathname.replace(/^\//, "")

  return (
    <>
      <NavDrawer
        modules={MODULES}
        active={activeModule}
        onSelect={(value) => navigate(`/${value}`)}
        onHome={() => navigate("/")}
      />

      <main className="hide-scrollbar h-dvh w-full overflow-y-auto snap-y snap-mandatory scroll-smooth bg-rack-bg text-neutral-200">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/modulo-1"
            element={
              <>
                <section className="flex min-h-dvh w-full snap-start snap-always shrink-0 overflow-visible lg:h-dvh lg:overflow-hidden">
                  <Modulo1 />
                </section>
                <Section2 />
              </>
            }
          />
          <Route
            path="/modulo-2"
            element={
              <>
                <section className="flex min-h-dvh w-full snap-start snap-always shrink-0 overflow-visible lg:h-dvh lg:overflow-hidden">
                  <Modulo2 />
                </section>
                <Modulo2Section2 />
              </>
            }
          />
          <Route
            path="/modulo-3"
            element={
              <>
                <section className="flex min-h-dvh w-full snap-start snap-always shrink-0 overflow-visible lg:h-dvh lg:overflow-hidden">
                  <Modulo3 />
                </section>
                <Modulo3Section2 />
              </>
            }
          />
        </Routes>
      </main>
    </>
  )
}

export default App
