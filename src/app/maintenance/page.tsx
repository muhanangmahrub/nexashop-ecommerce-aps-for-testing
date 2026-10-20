import { Wrench } from 'lucide-react';

export const metadata = { title: 'Under Maintenance' };

export default function MaintenancePage() {
  return (
    <div className="container flex flex-col items-center py-24 text-center" data-testid="maintenance-page">
      <Wrench className="h-16 w-16 text-primary" />
      <h1 className="mt-6 text-3xl font-bold" data-testid="maintenance-title">
        We&apos;ll be back soon!
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        NexaShop is currently undergoing scheduled maintenance to improve your shopping experience. Please check back shortly.
      </p>
    </div>
  );
}
