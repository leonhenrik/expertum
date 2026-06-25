import { Network } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrentUserProvider } from "@/components/current-user";
import { UserProfileHeader } from "@/components/user-profile-header";
import { NominateTab } from "@/components/nominate-tab";
import { VisualizeTab } from "@/components/visualize-tab";
import { getDisciplines, getUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [users, disciplines] = await Promise.all([
    getUsers(),
    getDisciplines(),
  ]);

  return (
    <CurrentUserProvider>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expertum</h1>
              <p className="text-sm text-muted-foreground">
                Nominate who is better than you — and watch expertise centers
                emerge.
              </p>
            </div>
          </div>
          <UserProfileHeader users={users} />
        </header>

        <Tabs defaultValue="nominate">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="nominate">Nominate</TabsTrigger>
            <TabsTrigger value="visualize">Visualize</TabsTrigger>
          </TabsList>
          <TabsContent value="nominate" className="pt-2">
            <NominateTab users={users} disciplines={disciplines} />
          </TabsContent>
          <TabsContent value="visualize" className="pt-2">
            <VisualizeTab disciplines={disciplines} users={users} />
          </TabsContent>
        </Tabs>
      </main>
    </CurrentUserProvider>
  );
}
