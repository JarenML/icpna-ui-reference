import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ResumenEjecutivo from './screens/ResumenEjecutivo';
import ConstruccionEscenario from './screens/ConstruccionEscenario';
import ResultadoSimulacion from './screens/ResultadoSimulacion';
import ComparacionEscenarios from './screens/ComparacionEscenarios';
import ReporteGranular from './screens/ReporteGranular';
import ReporteAlertas from './screens/ReporteAlertas';
import Trazabilidad from './screens/Trazabilidad';
import SimulationLoader from './components/SimulationLoader';

export type Screen =
  | 'resumen'
  | 'escenarios'
  | 'intervenciones'
  | 'comparacion'
  | 'granular'
  | 'alertas'
  | 'trazabilidad';

export default function App() {
  const [screen, setScreen] = useState<Screen>('resumen');
  const [simulating, setSimulating] = useState(false);

  const navigate = (s: Screen) => setScreen(s);

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setScreen('escenarios');
    }, 2200);
  };

  const renderScreen = () => {
    switch (screen) {
      case 'resumen':
        return <ResumenEjecutivo navigate={navigate} />;
      case 'escenarios':
        return <ResultadoSimulacion navigate={navigate} />;
      case 'intervenciones':
        return <ConstruccionEscenario navigate={navigate} onSimulate={runSimulation} />;
      case 'comparacion':
        return <ComparacionEscenarios navigate={navigate} />;
      case 'granular':
        return <ReporteGranular navigate={navigate} />;
      case 'alertas':
        return <ReporteAlertas navigate={navigate} />;
      case 'trazabilidad':
        return <Trazabilidad navigate={navigate} />;
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
