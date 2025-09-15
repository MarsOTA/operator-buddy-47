import React from 'react';
import { Settings, Bell, BellOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/appStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationSettings = () => {
  const { 
    currentOperatorId, 
    getNotificationPreferences, 
    updateNotificationPreferences 
  } = useAppStore();
  
  const { 
    isSupported, 
    subscription, 
    permission, 
    subscribe, 
    unsubscribe, 
    isLoading 
  } = usePushNotifications();

  if (!currentOperatorId) return null;

  const preferences = getNotificationPreferences(currentOperatorId) || {
    shiftAssignment: false,
    shiftUpdates: false,
    shiftCancellation: false
  };

  const handleTogglePush = async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    updateNotificationPreferences(currentOperatorId, {
      ...preferences,
      [key]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Impostazioni Notifiche
        </CardTitle>
        <CardDescription>
          Gestisci le notifiche push per i tuoi turni di lavoro
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Push Notifications Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Notifiche Push
              </Label>
            </div>
            <Button
              variant={subscription ? "default" : "outline"}
              size="sm"
              onClick={handleTogglePush}
              disabled={!isSupported || isLoading}
              className="flex items-center gap-2"
            >
              {subscription ? (
                <>
                  <BellOff className="h-4 w-4" />
                  Disattiva
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Attiva
                </>
              )}
            </Button>
          </div>

          {!isSupported && (
            <Alert>
              <AlertDescription>
                Il tuo browser non supporta le notifiche push.
              </AlertDescription>
            </Alert>
          )}

          {isSupported && permission === 'denied' && (
            <Alert>
              <AlertDescription>
                Le notifiche sono bloccate. Abilita le notifiche nelle impostazioni del browser.
              </AlertDescription>
            </Alert>
          )}

          {subscription && (
            <div className="text-xs text-muted-foreground bg-accent/20 p-2 rounded">
              ✓ Notifiche push attive per questo dispositivo
            </div>
          )}
        </div>

        <Separator />

        {/* Notification Preferences */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Tipi di notifica</Label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-assignment" className="text-sm cursor-pointer">
                Assegnazione turni
              </Label>
              <Switch
                id="shift-assignment"
                checked={preferences.shiftAssignment && subscription}
                onCheckedChange={(checked) => handlePreferenceChange('shiftAssignment', checked)}
                disabled={!subscription}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-updates" className="text-sm cursor-pointer">
                Modifiche turni
              </Label>
              <Switch
                id="shift-updates"
                checked={preferences.shiftUpdates && subscription}
                onCheckedChange={(checked) => handlePreferenceChange('shiftUpdates', checked)}
                disabled={!subscription}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-cancellation" className="text-sm cursor-pointer">
                Cancellazioni turni
              </Label>
              <Switch
                id="shift-cancellation"
                checked={preferences.shiftCancellation && subscription}
                onCheckedChange={(checked) => handlePreferenceChange('shiftCancellation', checked)}
                disabled={!subscription}
              />
            </div>
          </div>

          {!subscription && (
            <div className="text-xs text-muted-foreground">
              Attiva le notifiche push per configurare le preferenze
            </div>
          )}
        </div>

        <Separator />

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="font-medium">Come funzionano le notifiche:</div>
          <ul className="space-y-1 ml-4">
            <li>• Ricevi notifiche quando vieni assegnato a un turno</li>
            <li>• Vieni avvisato se un turno viene modificato</li>
            <li>• Ricevi conferma se un turno viene cancellato</li>
            <li>• Le notifiche funzionano anche quando l'app è chiusa</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};