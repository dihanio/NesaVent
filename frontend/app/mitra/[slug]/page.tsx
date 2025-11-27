
import { getMitraPublicProfile, getEventsByMitra } from "@/lib/mitra-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EventCard from "@/components/EventCard";
import { Separator } from "@/components/ui/separator";
import { notFound } from "next/navigation";

async function getMitraData(slug: string) {
    try {
        const [mitra, events] = await Promise.all([
            getMitraPublicProfile(slug),
            getEventsByMitra(slug),
        ]);
        return { mitra, events };
    } catch (error) {
        console.error("Failed to fetch mitra data:", error);
        return { mitra: null, events: [] };
    }
}


export default async function MitraPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { mitra, events }: { mitra: any, events: any[] } = await getMitraData(slug);

  if (!mitra) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
        <Avatar className="h-24 w-24 border">
          <AvatarImage src={mitra.avatar} alt={mitra.nama} />
          <AvatarFallback>{mitra.nama.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{mitra.nama}</h1>
          {mitra.organisasi && (
            <p className="mt-2 text-lg text-muted-foreground">{mitra.organisasi}</p>
          )}
        </div>
      </header>

      <Separator className="my-8" />

      <main>
        <h2 className="mb-6 text-2xl font-semibold">Events by {mitra.nama}</h2>
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
             <p className="text-muted-foreground">This organizer has no events yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
