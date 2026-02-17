"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  X,
  ImagePlus,
  Loader2,
  Home,
  Calendar,
  Euro,
  Maximize,
  Bed,
  AlertCircle,
  Info,
} from "lucide-react";
import { stepInfoSchema, stepLocationSchema, type StepInfoData, type StepLocationData } from "@/lib/schemas";
import { roomService } from "@/lib/apiClient";
import apiClient from "@/lib/apiClient";
import { useAuth } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { MAP_STYLE_URL } from "@/lib/mapConfig";
import "maplibre-gl/dist/maplibre-gl.css";
const REIMS = { lat: 49.2530, lng: 3.5713 };

// Retourne la classe CSS d'une étape selon son état (complétée / active / inactive)
function getStepClass(isCompleted: boolean, isActive: boolean): string {
  if (isCompleted) return "border-accent bg-accent text-accent-foreground";
  if (isActive) return "border-accent bg-accent-light text-accent";
  return "border-border bg-background text-muted-foreground";
}

const AMENITY_OPTIONS = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "balcon", label: "Balcon" },
  { id: "cave", label: "Cave" },
  { id: "jardin", label: "Jardin" },
  { id: "cuisine-equipee", label: "Cuisine équipée" },
  { id: "machine-a-laver", label: "Machine à laver" },
  { id: "ascenseur", label: "Ascenseur" },
  { id: "terrasse", label: "Terrasse" },
  { id: "local-velo", label: "Local vélo" },
];

const STEPS = [
  { num: 1, label: "Informations", icon: Home },
  { num: 2, label: "Localisation", icon: MapPin },
  { num: 3, label: "Photos", icon: ImagePlus },
];

function PublishPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef<MapRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [infoData, setInfoData] = useState<StepInfoData | null>(null);
  const [locationData, setLocationData] = useState<StepLocationData | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pinPosition, setPinPosition] = useState({ lat: REIMS.lat, lng: REIMS.lng });
  const [dragActive, setDragActive] = useState(false);

  // ─── Step 1 : Infos ──────────────────────────────────────
  const infoForm = useForm<StepInfoData>({
    resolver: zodResolver(stepInfoSchema),
    defaultValues: {
      title: "",
      description: "",
      budget: 400,
      rooms_count: 1,
      surface: undefined,
      is_furnished: false,
      amenities: [],
      availability: "",
    },
  });

  // ─── Step 2 : Localisation ────────────────────────────────
  const locationForm = useForm<StepLocationData>({
    resolver: zodResolver(stepLocationSchema),
    defaultValues: {
      latitude: REIMS.lat,
      longitude: REIMS.lng,
      street: "",
      city: "Reims",
      zip_code: "51100",
    },
  });

  const handleMapClick = useCallback(
    (e: { lngLat: { lng: number; lat: number } }) => {
      setPinPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      locationForm.setValue("latitude", e.lngLat.lat);
      locationForm.setValue("longitude", e.lngLat.lng);
    },
    [locationForm]
  );

  // ─── Step 3 : Photos ─────────────────────────────────────
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - imageUrls.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 photos autorisées");
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    const formData = new FormData();
    filesToUpload.forEach((f) => formData.append("images[]", f));

    try {
      const { data } = await apiClient.post("/upload/images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrls((prev) => [...prev, ...data.data.urls].slice(0, 5));
      toast.success(`${filesToUpload.length} photo${filesToUpload.length > 1 ? "s" : ""} ajoutée${filesToUpload.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Erreur lors de l'upload. Vérifiez le format (JPG, PNG, WebP, max 5MB).");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    toast.success("Photo supprimée");
  };

  // ─── Publication finale ───────────────────────────────────
  const handlePublish = async () => {
    if (!infoData || !locationData) return;

    if (imageUrls.length === 0) {
      toast.error("Veuillez ajouter au moins une photo");
      return;
    }

    setPublishing(true);
    try {
      await roomService.create({
        title: infoData.title,
        description: infoData.description || undefined,
        budget: infoData.budget,
        rooms_count: infoData.rooms_count,
        surface: infoData.surface,
        is_furnished: infoData.is_furnished,
        amenities: infoData.amenities || [],
        availability: infoData.availability || undefined,
        location: {
          type: "Point",
          coordinates: [locationData.longitude, locationData.latitude],
        },
        address: {
          street: locationData.street || undefined,
          city: locationData.city,
          zip_code: locationData.zip_code,
        },
        images: imageUrls,
        source_type: "manual",
        status: "active",
      });

      toast.success("Annonce publiée avec succès !");
      router.push("/");
    } catch {
      toast.error("Erreur lors de la publication. Veuillez réessayer.");
    } finally {
      setPublishing(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return infoForm.formState.isValid;
    if (step === 2) return locationForm.formState.isValid;
    if (step === 3) return imageUrls.length > 0;
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Header amélioré ────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto w-full max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-1 flex-col items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">Publier une annonce</h1>
              {/* Progress bar améliorée */}
              <div className="flex w-full max-w-md items-center gap-2">
                {STEPS.map((s, index) => {
                  const StepIcon = s.icon;
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <div key={s.num} className="flex flex-1 items-center gap-2">
                      <div className="flex flex-1 items-center gap-1">
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            isCompleted || isActive ? "bg-accent" : "bg-border"
                          }`}
                        />
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${getStepClass(isCompleted, isActive)}`}
                        >
                          {isCompleted ? (
                            <Check size={14} />
                          ) : (
                            <StepIcon size={14} />
                          )}
                        </div>
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            isCompleted ? "bg-accent" : "bg-border"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Étape {step} sur {STEPS.length} : {STEPS[step - 1].label}
              </p>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* ─── Contenu principal ─────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* ═══════ STEP 1 : INFOS ═══════ */}
        {step === 1 && (
          <form
            onSubmit={infoForm.handleSubmit((data) => {
              setInfoData(data);
              setStep(2);
            })}
            className="mx-auto max-w-2xl space-y-6"
          >
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-foreground">Informations de base</h2>
              <p className="text-sm text-muted-foreground">
                Renseignez les détails essentiels de votre logement
              </p>
            </div>

            {/* Titre */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Titre de l&apos;annonce <span className="text-error">*</span>
              </label>
              <input
                {...infoForm.register("title")}
                placeholder="Ex: Chambre meublée proche URCA, quartier calme"
                className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              {infoForm.formState.errors.title && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
                  <AlertCircle size={12} />
                  {infoForm.formState.errors.title.message}
                </p>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info size={12} />
                Un titre accrocheur augmente vos chances de recevoir des messages
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Description</label>
              <textarea
                {...infoForm.register("description")}
                rows={5}
                placeholder="Décrivez le logement, l'ambiance de la colocation, les avantages du quartier..."
                className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {infoForm.watch("description")?.length || 0} / 2000 caractères
              </p>
            </div>

            {/* Budget et Chambres */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  <Euro size={14} className="mr-1 inline" />
                  Budget (€/mois) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  {...infoForm.register("budget", { valueAsNumber: true })}
                  placeholder="400"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {infoForm.formState.errors.budget && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
                    <AlertCircle size={12} />
                    {infoForm.formState.errors.budget.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  <Bed size={14} className="mr-1 inline" />
                  Nombre de chambres <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  {...infoForm.register("rooms_count", { valueAsNumber: true })}
                  min={1}
                  max={20}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            {/* Surface et Disponibilité */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  <Maximize size={14} className="mr-1 inline" />
                  Surface (m²)
                </label>
                <input
                  type="number"
                  {...infoForm.register("surface", { valueAsNumber: true })}
                  placeholder="Ex: 14"
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  <Calendar size={14} className="mr-1 inline" />
                  Disponibilité
                </label>
                <input
                  type="date"
                  {...infoForm.register("availability")}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            {/* Meublé */}
            <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  {...infoForm.register("is_furnished")}
                  className="h-5 w-5 rounded border-border accent-accent"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Logement meublé</span>
                  <p className="text-xs text-muted-foreground">
                    Le logement est déjà équipé (mobilier, électroménager)
                  </p>
                </div>
              </label>
            </div>

            {/* Équipements */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-foreground">
                Équipements disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((amenity) => {
                  const selected = infoForm.watch("amenities")?.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => {
                        const current = infoForm.getValues("amenities") || [];
                        infoForm.setValue(
                          "amenities",
                          selected ? current.filter((x) => x !== amenity.id) : [...current, amenity.id]
                        );
                      }}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "border-accent bg-accent-light text-accent shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground hover:bg-muted"
                      }`}
                    >
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton suivant */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!canGoNext()}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* ═══════ STEP 2 : LOCALISATION ═══════ */}
        {step === 2 && (
          <form
            onSubmit={locationForm.handleSubmit((data) => {
              setLocationData(data);
              setStep(3);
            })}
            className="mx-auto max-w-2xl space-y-6"
          >
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-foreground">Localisation</h2>
              <p className="text-sm text-muted-foreground">
                Cliquez sur la carte pour placer votre annonce précisément
              </p>
            </div>

            {/* Carte interactive améliorée */}
            <div className="h-80 overflow-hidden rounded-[var(--radius-card)] border-2 border-border shadow-lg">
              <Map
                ref={mapRef}
                initialViewState={{ longitude: REIMS.lng, latitude: REIMS.lat, zoom: 13 }}
                mapStyle={MAP_STYLE_URL}
                style={{ width: "100%", height: "100%" }}
                onClick={handleMapClick}
                attributionControl={false}
              >
                <Marker longitude={pinPosition.lng} latitude={pinPosition.lat} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-accent p-2 shadow-xl">
                      <MapPin size={24} className="text-accent-foreground fill-current" />
                    </div>
                    <div className="mt-1 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground shadow-md">
                      Votre annonce
                    </div>
                  </div>
                </Marker>
              </Map>
            </div>

            {/* Coordonnées */}
            <div className="rounded-[var(--radius-button)] bg-accent-light/50 border border-accent/30 p-3 text-xs text-accent">
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span className="font-medium">
                  Lat: {pinPosition.lat.toFixed(6)}, Lng: {pinPosition.lng.toFixed(6)}
                </span>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Adresse complète
              </label>
              <input
                {...locationForm.register("street")}
                placeholder="Ex: 12 Rue du Moulin, Quartier Saint-Remi"
                className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* Ville et Code postal */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Ville <span className="text-error">*</span>
                </label>
                <input
                  {...locationForm.register("city")}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {locationForm.formState.errors.city && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
                    <AlertCircle size={12} />
                    {locationForm.formState.errors.city.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Code postal <span className="text-error">*</span>
                </label>
                <input
                  {...locationForm.register("zip_code")}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                {locationForm.formState.errors.zip_code && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
                    <AlertCircle size={12} />
                    {locationForm.formState.errors.zip_code.message}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons navigation */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>
              <button
                type="submit"
                disabled={!canGoNext()}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* ═══════ STEP 3 : PHOTOS ═══════ */}
        {step === 3 && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold text-foreground">Photos</h2>
              <p className="text-sm text-muted-foreground">
                Ajoutez jusqu&apos;à 5 photos de votre logement. La première photo sera la photo principale.
              </p>
            </div>

            {/* Upload zone améliorée */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border-2 border-dashed py-12 transition-all ${
                dragActive
                  ? "border-accent bg-accent-light/50"
                  : "border-border bg-muted/30 hover:border-accent/50 hover:bg-accent-light/30"
              } ${imageUrls.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !uploading && imageUrls.length < 5 && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                disabled={uploading || imageUrls.length >= 5}
              />
              {uploading ? (
                <>
                  <Loader2 size={32} className="animate-spin text-accent" />
                  <span className="text-sm font-medium text-foreground">Upload en cours...</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-accent-light p-4">
                    <ImagePlus size={28} className="text-accent" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold text-foreground">
                      Cliquez ou glissez des images ici
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG ou WebP • Max 5MB par photo • {imageUrls.length}/5 photos
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Preview grid améliorée */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {imageUrls.map((url, i) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-muted">
                    <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    {i === 0 && (
                      <div className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                        Principale
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs font-medium text-white">Photo {i + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Avertissement si pas de photos */}
            {imageUrls.length === 0 && (
              <div className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Au moins une photo est requise
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Les annonces avec photos reçoivent beaucoup plus de messages
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons navigation et publication */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || imageUrls.length === 0}
                className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Publier l&apos;annonce
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublishPage() {
  return (
    <ProtectedRoute>
      <PublishPageContent />
    </ProtectedRoute>
  );
}
