import Link from "next/link";

import AppHeader from "@/components/shared/AppHeader";

export default function HomePage() {
  return (
    <>
      <AppHeader />

      <main className="page-container">
        <div className="landing-hero">
          <div className="landing-icons">
            <span className="logo-icon logo-icon-lg">
              <img src="/icons/main_logo.svg" alt="" />
            </span>
            <span className="logo-icon logo-icon-lg">
              <img src="/icons/hr_logo.svg" alt="" />
            </span>
            <span className="logo-icon logo-icon-lg">
              <img src="/icons/letter.svg" alt="" />
            </span>
          </div>

          <h1 className="display-1">HR AI Assistant</h1>
          <p className="landing-description">
            Peona îi ajută pe candidați să găsească jobul potrivit, răspunde la
            întrebări despre procesul de recrutare și analizează CV-urile pentru
            a corela competențele cu posturile vacante de la Orange.
          </p>

          <div className="landing-cards">
            <div className="card card-hover landing-card-content">
              <span className="logo-icon">
                <img src="/icons/logo_message.svg" alt="" width={22} height={22} />
              </span>
              <h3 className="heading-4">Chat cu Peona</h3>
              <p className="text-sm text-secondary">
                Pune întrebări despre posturile vacante, procesul de interviu,
                beneficii sau încarcă CV-ul tău pentru analiză.
              </p>
              <Link href="/chat" className="btn btn-primary btn-full">
                Începe conversația
              </Link>
            </div>

            <div className="card card-hover landing-card-content">
              <span className="logo-icon">
                <img src="/icons/logo_mech.svg" alt="" width={22} height={22} />
              </span>
              <h3 className="heading-4">Admin Panel</h3>
              <p className="text-sm text-secondary">
                Gestionează baza de cunoștințe, șabloanele de prompturi,
                vizualizează feedbackul și configurează asistentul AI.
              </p>
              <Link href="/login" className="btn btn-secondary btn-full">
                Access Admin
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
