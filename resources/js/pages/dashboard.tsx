import { GLPIHeader } from '@/components/glpi-header';
import { DashboardCards } from '@/components/dashboard-cards';
import { GLPIFooter } from '@/components/glpi-footer';
import { Head } from '@inertiajs/react';
import { ViewTabs } from '@/components/view-tabs';

export default function Dashboard() {
    return (
        <>
            <Head title="HelpDesk HUV - Dashboard" />
            <div className="min-h-screen flex flex-col">
                <GLPIHeader />
                <main className="flex-1 bg-gray-50">
                    <ViewTabs />
                    <DashboardCards />
                </main>
                <GLPIFooter />
            </div>
        </>
    );
}
