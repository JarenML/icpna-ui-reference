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
import SimulationLoader from './components/SimulationLoader';
import type { EscenarioPendiente } from './data/constants';

export type Screen =
  | 'resumen'
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
      <Sidebar current={screen} navigate={navigate} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header screen={screen} navigate={navigate} />
        <main className="flex-1 overflow-y-auto">
          {simulating ? <SimulationLoader /> : renderScreen()}
        </main>
      </div>
    </div>
  );
}
