import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { useSupabasePushNotifications } from '@/hooks/useSupabasePushNotifications';
import { useAppBadge } from '@/hooks/useAppBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupabaseNotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useSupabaseNotifications();
  const { subscription, subscribe, unsubscribe, isLoading } = useSupabasePushNotifications();
  const { refreshBadge } = useAppBadge();

  const handleToggleNotifications = async () => {
    if (subscription) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    // Refresh badge after marking as read
    refreshBadge();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-header-foreground hover:bg-white/10">
          {subscription ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[400px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifiche
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleNotifications}
            disabled={isLoading}
            className="h-7 px-2 text-xs"
          >
            {isLoading ? 'Caricamento...' : subscription ? 'Disattiva' : 'Attiva'}
          </Button>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>
            Nessuna notifica
          </DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-pointer min-h-[80px] ${
                !notification.read ? 'bg-accent/50' : ''
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
              asChild={!!notification.event_id}
            >
              {notification.event_id ? (
                <Link to={`/operator/shift/${notification.shift_id || notification.event_id}`} className="w-full">
                  <div className="w-full">
                    <div className="font-medium text-sm mb-1">{notification.title}</div>
                    <div className="text-xs text-muted-foreground whitespace-pre-line mb-2">
                      {notification.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString('it-IT')}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-auto" />
                    )}
                  </div>
                </Link>
              ) : (
                <div className="w-full">
                  <div className="font-medium text-sm mb-1">{notification.title}</div>
                  <div className="text-xs text-muted-foreground whitespace-pre-line mb-2">
                    {notification.message}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString('it-IT')}
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1 ml-auto" />
                  )}
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-muted-foreground">
              +{notifications.length - 5} altre notifiche
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};