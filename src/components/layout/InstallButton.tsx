import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone;
    setIsInstalled(isStandalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Handle the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      toast.success('App installata con successo!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installata!');
      }
      
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else if (isIOS) {
      toast.info('Per installare: tocca il pulsante Condividi e seleziona "Aggiungi alla schermata Home"');
    }
  };

  const handleCloseBanner = () => {
    setShowInstallBanner(false);
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Show install button for iOS or when prompt is available
  if (!showInstallBanner && !isIOS) return null;

  return (
    <div className="relative">
      {showInstallBanner && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 m-4 max-w-sm">
          <button
            onClick={handleCloseBanner}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Installa EZYSTAFF</p>
              <p className="text-xs text-muted-foreground">Accesso rapido dalla home</p>
            </div>
          </div>
          <Button 
            onClick={handleInstallClick}
            className="w-full mt-3"
            size="sm"
          >
            Installa
          </Button>
        </div>
      )}
      
      {isIOS && !showInstallBanner && (
        <Button
          onClick={handleInstallClick}
          variant="ghost"
          size="sm"
          className="text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/5"
        >
          <Download className="w-4 h-4 mr-2" />
          Installa
        </Button>
      )}
    </div>
  );
};

export default InstallButton;