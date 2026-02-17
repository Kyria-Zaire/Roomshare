"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function PrivacyPage() {
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
            Politique de Confidentialité
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Contenu */}
        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Collecte des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Roomshare collecte les données suivantes lors de votre inscription :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Mot de passe (hashé de manière sécurisée)</li>
              <li>Type de profil (locataire ou propriétaire)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Utilisation des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données personnelles sont utilisées uniquement pour :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Gérer votre compte utilisateur</li>
              <li>Vous permettre de publier ou consulter des annonces</li>
              <li>Faciliter la communication entre utilisateurs</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Protection des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:contact@roomshare.fr" className="text-accent hover:underline">
                contact@roomshare.fr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Roomshare utilise des cookies essentiels pour le fonctionnement de l'application. Aucun cookie de suivi publicitaire n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter à{" "}
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
