
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HomeClient = dynamic(() => import('./HomeClient').then(mod => mod.HomeClient), { 
  loading: () => (
    <div className="flex flex-col min-h-[100dvh]">
      <main className="flex-1">
        <div className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-24">
              <div className="flex flex-col justify-center space-y-6">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-16 w-48 mt-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <Skeleton className="aspect-[2/3] w-full max-w-[450px] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  ),
  ssr: false 
});

export const metadata: Metadata = {
  title: "Nature of the Divine | Official Website & Book by Alfas B",
  description: "Official website for 'Nature of the Divine' by Alfas B. A profound philosophical book exploring consciousness, the essence of existence, and humanity's path to aligning with the divine. Read samples and order your signed copy today.",
};

export default function Home() {
  return <HomeClient />;
}
