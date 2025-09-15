import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      toast.success('App installata con successo!');
    };

    // Handle service worker updates
    const handleSWUpdate = (event: any) => {
      setNeedsRefresh(true);
      setUpdateServiceWorker(() => () => {
        if (event.detail && event.detail.skipWaiting) {
          event.detail.skipWaiting();
          window.location.reload();
        }
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('sw:update-available', handleSWUpdate);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('sw:update-available', handleSWUpdate);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installata!');
      }
      
      setDeferredPrompt(null);
    }
  };

  const refreshApp = () => {
    if (updateServiceWorker) {
      updateServiceWorker();
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    needsRefresh,
    installApp,
    refreshApp,
    canInstall: !!deferredPrompt
  };
};