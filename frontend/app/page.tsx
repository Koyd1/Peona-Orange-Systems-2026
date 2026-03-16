import Link from "next/link";

import AppHeader from "@/components/shared/AppHeader";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="max-w-[1200px] mx-auto px-6 py-6">
        <div className="text-center pt-16 pb-12">
          <div className="mb-6 flex justify-center">
            <img
              src="/icons/hr_assistant_logo.svg"
              alt="HR AI Assistant logo"
              className="h-[104px] w-[104px] object-contain"
            />
          </div>

          <h1 className="text-[3.5rem] font-bold leading-[1.15]">HR AI Assistant</h1>
          <p className="max-w-[600px] mx-auto mt-4 mb-12 text-gray-500">
            Peona îi ajută pe candidați să găsească jobul potrivit, răspunde la
            întrebări despre procesul de recrutare și analizează CV-urile pentru
            a corela competențele cu posturile vacante de la Orange.
          </p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 max-w-[820px] mx-auto">
            <Card hover className="text-left p-8">
              <span className="inline-flex items-center justify-center w-11 h-11 bg-[#fbefe8] rounded-lg mb-5">
                <img src="/icons/logo_message.svg" alt="" width={22} height={22} />
              </span>
              <h3 className="text-xl font-semibold mb-2.5">Chat cu Peona</h3>
              <p className="text-sm text-gray-500 mb-7">
                Pune întrebări despre posturile vacante, procesul de interviu,
                beneficii sau încarcă CV-ul tău pentru analiză.
              </p>
              <Link href="/chat" className={buttonVariants({ fullWidth: true })}>
                Începe conversația
              </Link>
            </Card>

            <Card hover className="text-left p-8">
              <span className="inline-flex items-center justify-center w-11 h-11 bg-[#fbefe8] rounded-lg mb-5">
                <img src="/icons/logo_mech.svg" alt="" width={22} height={22} />
              </span>
              <h3 className="text-xl font-semibold mb-2.5">Admin Panel</h3>
              <p className="text-sm text-gray-500 mb-7">
                Gestionează baza de cunoștințe, șabloanele de prompturi,
                vizualizează feedbackul și configurează asistentul AI.
              </p>
              <Link href="/login" className={buttonVariants({ variant: "secondary", fullWidth: true })}>
                Access Admin
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
