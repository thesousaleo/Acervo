import { AnimatePresence, motion } from 'framer-motion';
import { Dock } from './components/Dock';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal/ItemModal';
import { MeshBackground } from './components/MeshBackground';
import { Toast } from './components/Toast';
import { Agora } from './pages/Agora';
import { Backup } from './pages/Backup';
import { Biblioteca } from './pages/Biblioteca';
import { Desejos } from './pages/Desejos';
import { Diario } from './pages/Diario';
import { useLibrary } from './store/useLibrary';

const PAGES = { agora: Agora, biblioteca: Biblioteca, desejos: Desejos, diario: Diario, backup: Backup };

export default function App() {
  const { tab, u } = useLibrary();
  const Page = PAGES[tab];
  return (
    <>
      <MeshBackground />
      <div className="app">
        <div className="wrap">
          <Header />
          <AnimatePresence mode="wait" initial={false}>
            <motion.main key={tab + u} initial={{ opacity: 0.3, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .28, ease: [0.2, 0.9, 0.3, 1] }}>
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
