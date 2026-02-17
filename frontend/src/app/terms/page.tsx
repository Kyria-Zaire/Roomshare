"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/register"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Retour à l'inscription
          </Link>
          <div className="mb-6 flex justify-center">
            <Logo size={64} />
          </div>
          <h1 className="text-center text-3xl font-bold text-foreground">
            Conditions Générales d'Utilisation
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Contenu */}
        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Objet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Roomshare, 
              service de mise en relation pour la colocation à Reims.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Acceptation des CGU</h2>
            <p className="text-muted-foreground leading-relaxed">
              En créant un compte sur Roomshare, vous acceptez sans réserve les présentes CGU. 
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Compte utilisateur</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Pour utiliser Roomshare, vous devez :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Créer un compte avec des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de vos identifiants</li>
              <li>Être responsable de toutes les activités effectuées depuis votre compte</li>
              <li>Notifier immédiatement toute utilisation non autorisée</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Utilisation du service</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Vous vous engagez à :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Publier uniquement des annonces légitimes et conformes à la législation</li>
              <li>Respecter les autres utilisateurs et leurs biens</li>
              <li>Ne pas utiliser le service à des fins frauduleuses ou illégales</li>
              <li>Ne pas diffuser de contenu offensant, discriminatoire ou illégal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              Roomshare agit en tant que plateforme de mise en relation. Nous ne sommes pas responsables 
              des transactions entre utilisateurs, des litiges entre locataires et propriétaires, 
              ou de la véracité des informations publiées par les utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le contenu de Roomshare (design, logo, textes) est protégé par le droit d'auteur. 
              Vous ne pouvez pas reproduire, modifier ou distribuer ce contenu sans autorisation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Modification des CGU</h2>
            <p className="text-muted-foreground leading-relaxed">
              Roomshare se réserve le droit de modifier les présentes CGU à tout moment. 
              Les utilisateurs seront informés des modifications importantes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Résiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Roomshare se réserve le droit de suspendre ou résilier votre compte en cas de non-respect 
              des présentes CGU ou d'activité frauduleuse.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant ces CGU, contactez-nous à{" "}
              <a href="mailto:contact@roomshare.fr" className="text-accent hover:underline">
                contact@roomshare.fr
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800"
          >
            <ArrowLeft size={16} />
            Retour à l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
}
