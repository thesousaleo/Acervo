import { Dock } from './components/Dock';
import { ItemModal } from './components/ItemModal/ItemModal';
import { MeshBackground } from './components/MeshBackground';
import { NoteSheet } from './components/NoteSheet';
import { Toast } from './components/Toast';
import { Area } from './pages/Area';
import { Backup } from './pages/Backup';
import { Diario } from './pages/Diario';
import { Inicio } from './pages/Inicio';
import { useLibrary } from './store/useLibrary';

const PAGES = {
  inicio: Inicio,
  tela: () => <Area u="tela" />,
  jogos: () => <Area u="jogos" />,
  livros: () => <Area u="livros" />,
  diario: Diario,
  backup: Backup
};

export default function App() {
  const { tab } = useLibrary();
  const Page = PAGES[tab];
  return (
    <>
      <MeshBackground />
      <div className="app">
        <div className="wrap">
          {/* troca de aba instantânea, com uma entrada curta (sem esperar a saída da anterior) */}
          <main key={tab} className="page-in"><Page /></main>
        </div>
      </div>
      <Dock />
      <ItemModal />
      <NoteSheet />
      <Toast />
    </>
  );
}
