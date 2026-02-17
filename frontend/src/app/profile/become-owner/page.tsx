"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Check, FileText, Home } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

/**
 * Page /profile/become-owner — Tunnel de vérification d'identité.
 * Permet aux locataires de soumettre leurs documents pour devenir propriétaire.
 */
function BecomeOwnerPageContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [residenceFile, setResidenceFile] = useState<File | null>(null);
  const [dragActiveIdentity, setDragActiveIdentity] = useState(false);
  const [dragActiveResidence, setDragActiveResidence] = useState(false);
  const [uploading, setUploading] = useState(false);
  const identityInputRef = useRef<HTMLInputElement>(null);
  const residenceInputRef = useRef<HTMLInputElement>(null);

  // Rediriger si déjà owner
  useEffect(() => {
    if (user?.role === "owner") {
      router.push("/profile");
    }
  }, [user, router]);

  // Rediriger si pas connecté (géré par ProtectedRoute mais double sécurité)
  if (!user || user.role === "owner") {
    return null;
  }

  const handleDrag = (
    e: React.DragEvent,
    setDragActive: (active: boolean) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    setFile: (file: File | null) => void,
    setDragActive: (active: boolean) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Vérifier le type de fichier
      if (
        file.type.startsWith("image/") ||
        file.type === "application/pdf"
      ) {
        // Vérifier la taille (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Le fichier est trop volumineux (max 10MB)");
          return;
        }
        setFile(file);
      } else {
        toast.error("Format non supporté. Utilisez une image (JPG, PNG) ou PDF.");
      }
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (
        file.type.startsWith("image/") ||
        file.type === "application/pdf"
      ) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("Le fichier est trop volumineux (max 10MB)");
          return;
        }
        setFile(file);
      } else {
        toast.error("Format non supporté. Utilisez une image (JPG, PNG) ou PDF.");
      }
    }
  };

  const removeFile = (setFile: (file: File | null) => void) => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identityFile || !residenceFile) {
      toast.error("Veuillez télécharger les deux documents requis.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("identity_document", identityFile);
      formData.append("residence_document", residenceFile);

      const { data } = await apiClient.post("/user/verify-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "Votre demande de vérification a été envoyée. Nous examinerons vos documents sous peu."
      );

      // Rafraîchir les données utilisateur pour obtenir le nouveau statut
      await refreshUser?.();

      // Rediriger vers le profil
      router.push("/profile");
    } catch (error: any) {
      console.error("Erreur soumission vérification:", error);
      const message =
        error.response?.data?.message ||
        "Une erreur est survenue lors de l'envoi de vos documents.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-32">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Vérifiez votre profil Propriétaire
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pour publier des annonces sur Roomshare, nous devons vérifier votre
          identité et votre adresse. Vos documents sont traités de manière
          sécurisée et confidentielle.
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pièce d'identité */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Pièce d'identité (Recto/Verso)
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            Format accepté : JPG, PNG ou PDF (max 10MB). Vous pouvez prendre une
            photo de votre carte d'identité ou passeport.
          </p>

          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragActiveIdentity
                ? "border-accent bg-accent-light/50"
                : identityFile
                ? "border-accent bg-accent-light/20"
                : "border-accent/40 bg-muted/30 hover:border-accent/60"
            }`}
            onDragEnter={(e) => handleDrag(e, setDragActiveIdentity)}
            onDragLeave={(e) => handleDrag(e, setDragActiveIdentity)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveIdentity(true);
            }}
            onDrop={(e) =>
              handleDrop(e, setIdentityFile, setDragActiveIdentity)
            }
          >
            <input
              ref={identityInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setIdentityFile)}
            />

            {identityFile ? (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {identityFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(identityFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(setIdentityFile)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => identityInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Upload size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ou cliquez pour sélectionner
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Justificatif de domicile */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Justificatif de domicile
          </label>
          <p className="mb-3 text-xs text-muted-foreground">
            Format accepté : JPG, PNG ou PDF (max 10MB). Facture récente (moins
            de 3 mois), quittance de loyer, ou attestation d'hébergement.
          </p>

          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragActiveResidence
                ? "border-accent bg-accent-light/50"
                : residenceFile
                ? "border-accent bg-accent-light/20"
                : "border-accent/40 bg-muted/30 hover:border-accent/60"
            }`}
            onDragEnter={(e) => handleDrag(e, setDragActiveResidence)}
            onDragLeave={(e) => handleDrag(e, setDragActiveResidence)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActiveResidence(true);
            }}
            onDrop={(e) =>
              handleDrop(e, setResidenceFile, setDragActiveResidence)
            }
          >
            <input
              ref={residenceInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setResidenceFile)}
            />

            {residenceFile ? (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {residenceFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(residenceFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(setResidenceFile)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => residenceInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 p-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <Upload size={24} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ou cliquez pour sélectionner
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-[var(--radius-button)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!identityFile || !residenceFile || uploading}
            className="flex-1 rounded-[var(--radius-button)] bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function BecomeOwnerPage() {
  return (
    <ProtectedRoute>
      <BecomeOwnerPageContent />
    </ProtectedRoute>
  );
}
