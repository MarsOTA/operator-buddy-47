import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { toast } from '@/hooks/use-toast'

registerSW({
  onNeedRefresh() {
    toast({ title: 'App aggiornata — ricarica' })
  },
})

createRoot(document.getElementById('root')!).render(<App />);
