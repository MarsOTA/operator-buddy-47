import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

const NotificationSettingsPage = () => {
  return (
    <main className="container py-8">
      <Helmet>
        <title>Impostazioni Notifiche | EZYSTAFF</title>
        <meta name="description" content="Configura le notifiche push per i tuoi turni di lavoro" />
        <link rel="canonical" href="/notifications/settings" />
      </Helmet>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Torna alla Dashboard
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Impostazioni Notifiche</h1>
            <p className="text-muted-foreground">
              Gestisci le notifiche push per i tuoi turni di lavoro
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <NotificationSettings />
      </div>
    </main>
  );
};

export default NotificationSettingsPage;