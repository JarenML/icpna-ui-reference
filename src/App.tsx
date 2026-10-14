import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ResumenEjecutivo from './screens/ResumenEjecutivo';
import ConstruccionEscenario from './screens/ConstruccionEscenario';
import ListaEscenarios from './screens/ListaEscenarios';
import ResultadoSimulacion from './screens/ResultadoSimulacion';
import ComparacionEscenarios from './screens/ComparacionEscenarios';
import ReporteGranular from './screens/ReporteGranular';
import ReporteAlertas from './screens/ReporteAlertas';
import Trazabilidad from './screens/Trazabilidad';
import PowerBI from './screens/PowerBI';
import Baseline from './screens/Baseline';
import SimulationLoader from './components/SimulationLoader';
import type { EscenarioPendiente } from './data/constants';
import { BASELINE_CANDIDATO, BASELINE_VERSIONES, type BaselineVersion } from './data/baseline';

export type Screen =
  | 'resumen'
  | 'baseline'
  | 'listaEscenarios'
  | 'escenarios'
  | 'intervenciones'
  | 'comparacion'
  | 'granular'
  | 'alertas'
  | 'trazabilidad'
  | 'powerbi';

export default function App() {
  const [screen, setScreen] = useState<Screen>('resumen');
  const [simulating, setSimulating] = useState(false);
  const [escenarioId, setEscenarioId] = useState('esc03');
  // Scenarios created in this session (Borrador, without results)
  const [creados, setCreados] = useState<EscenarioPendiente[]>([]);
  // Baseline versions; the candidate is available until it is integrated or rejected
  const [baselines, setBaselines] = useState<BaselineVersion[]>(BASELINE_VERSIONES);
  const [hayNuevoBaseline, setHayNuevoBaseline] = useState(true);
  const baselineActivo = baselines.find((b) => b.estado === 'Activo')!.codigo;

  const candidatoComo = (estado: BaselineVersion['estado'], atipico = false, revisor: string | null = null): BaselineVersion => {
    const c = BASELINE_CANDIDATO;
    const activo = estado === 'Activo';
    return {
      codigo: c.codigo, estado, total: atipico ? c.atipico.total : c.total,
      variacion: activo ? (atipico ? c.atipico.variacion : c.variacion) : null, periodos: c.periodos,
      filas: c.filas, cargado: '14 Oct 2026 · 08:05', validadoPor: 'Motor de verificación', origen: c.origen,
      checks: !activo ? { ok: 4, warn: 1, fail: 2 } : atipico ? { ok: 5, warn: 2, fail: 0 } : { ok: 6, warn: 1, fail: 0 },
      motivo: estado === 'No apto' ? 'Periodo 2027-12 incompleto; total por jerarquía no cuadra en el nivel Sede' : undefined,
      revision: atipico
        ? revisor
          ? `Variación atípica (+${c.atipico.variacion}%) confirmada por ${revisor}`
          : `Variación atípica (+${c.atipico.variacion}%) integrada sin revisión externa`
        : undefined,
    };
  };

  const integrarBaseline = (atipico: boolean, revisor: string | null) => {
    setBaselines((prev) => [candidatoComo('Activo', atipico, revisor), ...prev.map((b) => (b.estado === 'Activo' ? { ...b, estado: 'Archivado' as const } : b))]);
    setHayNuevoBaseline(false);
  };

  const rechazarBaseline = () => {
    setBaselines((prev) => [prev[0], candidatoComo('No apto'), ...prev.slice(1)]);
    setHayNuevoBaseline(false);
  };

  const navigate = (s: Screen) => setScreen(s);

  const openEscenario = (id: string) => {
    setEscenarioId(id);
    setScreen('escenarios');
  };

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setEscenarioId('esc03');
      setScreen('escenarios');
    }, 2200);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'resumen':
        return <ResumenEjecutivo navigate={navigate} />;
      case 'baseline':
        return <Baseline versiones={baselines} hayNueva={hayNuevoBaseline} onIntegrar={integrarBaseline} onRechazar={rechazarBaseline} />;
      case 'listaEscenarios':
        return <ListaEscenarios
            navigate={navigate}
            openEscenario={openEscenario}
            creados={creados}
            onCrear={(e) => setCreados((prev) => [...prev, e])}
          />;
      case 'escenarios':
        return <ResultadoSimulacion navigate={navigate} escenarioId={escenarioId} />;
      case 'intervenciones':
        return <ConstruccionEscenario navigate={navigate} onSimulate={runSimulation} creados={creados} />;
      case 'comparacion':
        return <ComparacionEscenarios navigate={navigate} openEscenario={openEscenario} />;
      case 'granular':
        return <ReporteGranular navigate={navigate} />;
      case 'alertas':
        return <ReporteAlertas navigate={navigate} />;
      case 'trazabilidad':
        return <Trazabilidad navigate={navigate} />;
      case 'powerbi':
        return <PowerBI />;
      default:
        return <ResumenEjecutivo navigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar current={screen} navigate={navigate} baselineActivo={baselineActivo} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header screen={screen} navigate={navigate} />
        <main className="flex-1 overflow-y-auto">
          {simulating ? <SimulationLoader /> : renderScreen()}
        </main>
      </div>
    </div>
  );
}
