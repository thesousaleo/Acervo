import { AnimatePresence, motion } from 'framer-motion';
import { Dock } from './components/Dock';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal/ItemModal';
import { MeshBackground } from './components/MeshBackground';
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
          <Header />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main key={tab} initial={{ opacity: 0.3, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .28, ease: [0.2, 0.9, 0.3, 1] }}>
              <Page />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
      <Dock />
      <ItemModal />
      <Toast />
    </>
  );
}
