import { Network } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrentUserProvider } from "@/components/current-user";
import { UserProfileHeader } from "@/components/user-profile-header";
import { NominateTab } from "@/components/nominate-tab";
import { VisualizeTab } from "@/components/visualize-tab";
import { getDisciplines, getNominations, getUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [users, disciplines, nominations] = await Promise.all([
    getUsers(),
    getDisciplines(),
    getNominations(),
  ]);

  return (
    <CurrentUserProvider>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Tabs defaultValue="nominate">
          <header className="mb-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Expertum</h1>
                <p className="text-sm text-muted-foreground">
                  Find who to ask.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TabsList>
                <TabsTrigger value="nominate" className="w-24">Nominate</TabsTrigger>
                <TabsTrigger value="visualize" className="w-24">Visualize</TabsTrigger>
              </TabsList>
              <UserProfileHeader users={users} />
            </div>
          </header>

          <TabsContent value="nominate" className="pt-2">
            <NominateTab users={users} disciplines={disciplines} nominations={nominations} />
          </TabsContent>
          <TabsContent value="visualize" className="pt-2">
            <VisualizeTab disciplines={disciplines} users={users} />
          </TabsContent>
        </Tabs>
      </main>
    </CurrentUserProvider>
  );
}
