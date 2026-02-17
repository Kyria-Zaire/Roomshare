"use client";

import { useState, useRef, useCallback, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Map, { Marker } from "react-map-gl/maplibre";
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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { MAP_STYLE_URL } from "@/lib/mapConfig";
import "maplibre-gl/dist/maplibre-gl.css";

// ─── Constants ────────────────────────────────────────────────
const REIMS = { lat: 49.253, lng: 3.5713 };
const MAX_PHOTOS = 5;
const MAP_DEFAULT_ZOOM = 13;
const ICON_SM = 14;
const ICON_MD = 16;

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

// ─── StepIndicator ────────────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex w-full max-w-md items-center gap-2">
      {STEPS.map((stepDef) => {
        const StepIcon = stepDef.icon;
        const isActive = currentStep === stepDef.num;
        const isCompleted = currentStep > stepDef.num;
        return (
          <div key={stepDef.num} className="flex flex-1 items-center gap-1">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${isCompleted || isActive ? "bg-accent" : "bg-border"}`} />
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${getStepClass(isCompleted, isActive)}`}>
              {isCompleted ? <Check size={ICON_SM} /> : <StepIcon size={ICON_SM} />}
            </div>
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${isCompleted ? "bg-accent" : "bg-border"}`} />
          </div>
        );
      })}
    </div>
  );
}

// ─── StepInfoForm ─────────────────────────────────────────────
interface StepInfoFormProps {
  form: UseFormReturn<StepInfoData>;
  onValidSubmit: (data: StepInfoData) => void;
  canGoNext: boolean;
}

function StepInfoForm({ form, onValidSubmit, canGoNext }: StepInfoFormProps) {
  const { register, handleSubmit, watch, getValues, setValue, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="mx-auto max-w-2xl space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-foreground">Informations de base</h2>
        <p className="text-sm text-muted-foreground">Renseignez les détails essentiels de votre logement</p>
      </div>

      {/* Titre */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Titre de l&apos;annonce <span className="text-error">*</span>
        </label>
        <input
          {...register("title")}
          placeholder="Ex: Chambre meublée proche URCA, quartier calme"
          className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        {errors.title && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
            <AlertCircle size={ICON_SM} />
            {errors.title.message}
          </p>
        )}
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info size={ICON_SM} />
          Un titre accrocheur augmente vos chances de recevoir des messages
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">Description</label>
        <textarea
          {...register("description")}
          rows={5}
          placeholder="Décrivez le logement, l'ambiance de la colocation, les avantages du quartier..."
          className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {watch("description")?.length || 0} / 2000 caractères
        </p>
      </div>

      {/* Budget et Chambres */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            <Euro size={ICON_SM} className="mr-1 inline" />
            Budget (€/mois) <span className="text-error">*</span>
          </label>
          <input
            type="number"
            {...register("budget", { valueAsNumber: true })}
            placeholder="400"
            className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.budget && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={ICON_SM} />
              {errors.budget.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            <Bed size={ICON_SM} className="mr-1 inline" />
            Nombre de chambres <span className="text-error">*</span>
          </label>
          <input
            type="number"
            {...register("rooms_count", { valueAsNumber: true })}
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
            <Maximize size={ICON_SM} className="mr-1 inline" />
            Surface (m²)
          </label>
          <input
            type="number"
            {...register("surface", { valueAsNumber: true })}
            placeholder="Ex: 14"
            className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            <Calendar size={ICON_SM} className="mr-1 inline" />
            Disponibilité
          </label>
          <input
            type="date"
            {...register("availability")}
            className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Meublé */}
      <div className="rounded-[var(--radius-card)] border border-border bg-muted/30 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            {...register("is_furnished")}
            className="h-5 w-5 rounded border-border accent-accent"
          />
          <div>
            <span className="text-sm font-semibold text-foreground">Logement meublé</span>
            <p className="text-xs text-muted-foreground">Le logement est déjà équipé (mobilier, électroménager)</p>
          </div>
        </label>
      </div>

      {/* Équipements */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-foreground">Équipements disponibles</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const selected = watch("amenities")?.includes(amenity.id);
            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() => {
                  const current = getValues("amenities") || [];
                  setValue("amenities", selected ? current.filter((id) => id !== amenity.id) : [...current, amenity.id]);
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

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={!canGoNext}
          className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
          <ArrowRight size={ICON_MD} />
        </button>
      </div>
    </form>
  );
}

// ─── StepLocationForm ─────────────────────────────────────────
interface MapClickEvent {
  lngLat: { lng: number; lat: number };
}

interface StepLocationFormProps {
  form: UseFormReturn<StepLocationData>;
  pinPosition: { lat: number; lng: number };
  onMapClick: (mapEvt: MapClickEvent) => void;
  onValidSubmit: (data: StepLocationData) => void;
  onBack: () => void;
  canGoNext: boolean;
}

function StepLocationForm({ form, pinPosition, onMapClick, onValidSubmit, onBack, canGoNext }: StepLocationFormProps) {
  const { register, handleSubmit, formState: { errors } } = form;

  return (
    <form onSubmit={handleSubmit(onValidSubmit)} className="mx-auto max-w-2xl space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-foreground">Localisation</h2>
        <p className="text-sm text-muted-foreground">Cliquez sur la carte pour placer votre annonce précisément</p>
      </div>

      <div className="h-80 overflow-hidden rounded-[var(--radius-card)] border-2 border-border shadow-lg">
        <Map
          initialViewState={{ longitude: REIMS.lng, latitude: REIMS.lat, zoom: MAP_DEFAULT_ZOOM }}
          mapStyle={MAP_STYLE_URL}
          style={{ width: "100%", height: "100%" }}
          onClick={onMapClick}
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

      <div className="rounded-[var(--radius-button)] bg-accent-light/50 border border-accent/30 p-3 text-xs text-accent">
        <div className="flex items-center gap-2">
          <MapPin size={ICON_SM} />
          <span className="font-medium">Lat: {pinPosition.lat.toFixed(6)}, Lng: {pinPosition.lng.toFixed(6)}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-foreground">Adresse complète</label>
        <input
          {...register("street")}
          placeholder="Ex: 12 Rue du Moulin, Quartier Saint-Remi"
          className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Ville <span className="text-error">*</span>
          </label>
          <input
            {...register("city")}
            className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.city && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={ICON_SM} />
              {errors.city.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Code postal <span className="text-error">*</span>
          </label>
          <input
            {...register("zip_code")}
            className="w-full rounded-[var(--radius-button)] border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.zip_code && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={ICON_SM} />
              {errors.zip_code.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft size={ICON_MD} />
          Précédent
        </button>
        <button
          type="submit"
          disabled={!canGoNext}
          className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
          <ArrowRight size={ICON_MD} />
        </button>
      </div>
    </form>
  );
}

// ─── ImageUploadZone ──────────────────────────────────────────
interface ImageUploadZoneProps {
  dragActive: boolean;
  uploading: boolean;
  imageCount: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrag: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (files: FileList | null) => void;
}

function ImageUploadZone({ dragActive, uploading, imageCount, fileInputRef, onDrag, onDrop, onFileChange }: ImageUploadZoneProps) {
  const isFull = imageCount >= MAX_PHOTOS;
  return (
    <div
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border-2 border-dashed py-12 transition-all ${
        dragActive ? "border-accent bg-accent-light/50" : "border-border bg-muted/30 hover:border-accent/50 hover:bg-accent-light/30"
      } ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => !uploading && !isFull && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => onFileChange(event.target.files)}
        className="hidden"
        disabled={uploading || isFull}
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
            <span className="text-sm font-semibold text-foreground">Cliquez ou glissez des images ici</span>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG ou WebP • Max 5MB par photo • {imageCount}/{MAX_PHOTOS} photos
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── StepPhotosPanel ─────────────────────────────────────────
interface StepPhotosPanelProps {
  imageUrls: string[];
  uploading: boolean;
  publishing: boolean;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDrag: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onBack: () => void;
  onPublish: () => void;
}

function StepPhotosPanel({
  imageUrls, uploading, publishing, dragActive, fileInputRef,
  onDrag, onDrop, onFileChange, onRemoveImage, onBack, onPublish,
}: StepPhotosPanelProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-foreground">Photos</h2>
        <p className="text-sm text-muted-foreground">
          Ajoutez jusqu&apos;à {MAX_PHOTOS} photos de votre logement. La première photo sera la photo principale.
        </p>
      </div>

      <ImageUploadZone
        dragActive={dragActive}
        uploading={uploading}
        imageCount={imageUrls.length}
        fileInputRef={fileInputRef}
        onDrag={onDrag}
        onDrop={onDrop}
        onFileChange={onFileChange}
      />

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {imageUrls.map((url, index) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-muted">
              <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && (
                <div className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                  Principale
                </div>
              )}
              <button
                onClick={() => onRemoveImage(index)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-primary"
              >
                <X size={ICON_MD} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-xs font-medium text-white">Photo {index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {imageUrls.length === 0 && (
        <div className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Au moins une photo est requise</p>
              <p className="mt-1 text-xs text-muted-foreground">Les annonces avec photos reçoivent beaucoup plus de messages</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft size={ICON_MD} />
          Précédent
        </button>
        <button
          onClick={onPublish}
          disabled={publishing || imageUrls.length === 0}
          className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {publishing ? (
            <>
              <Loader2 size={ICON_MD} className="animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <Check size={ICON_MD} />
              Publier l&apos;annonce
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── PublishPageContent ───────────────────────────────────────
function PublishPageContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [infoData, setInfoData] = useState<StepInfoData | null>(null);
  const [locationData, setLocationData] = useState<StepLocationData | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [pinPosition, setPinPosition] = useState({ lat: REIMS.lat, lng: REIMS.lng });
  const [dragActive, setDragActive] = useState(false);

  const infoForm = useForm<StepInfoData>({
    resolver: zodResolver(stepInfoSchema),
    defaultValues: { title: "", description: "", budget: 400, rooms_count: 1, surface: undefined, is_furnished: false, amenities: [], availability: "" },
  });

  const locationForm = useForm<StepLocationData>({
    resolver: zodResolver(stepLocationSchema),
    defaultValues: { latitude: REIMS.lat, longitude: REIMS.lng, street: "", city: "Reims", zip_code: "51100" },
  });

  const handleMapClick = useCallback(
    (mapEvt: MapClickEvent) => {
      setPinPosition({ lat: mapEvt.lngLat.lat, lng: mapEvt.lngLat.lng });
      locationForm.setValue("latitude", mapEvt.lngLat.lat);
      locationForm.setValue("longitude", mapEvt.lngLat.lng);
    },
    [locationForm]
  );

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = MAX_PHOTOS - imageUrls.length;
    if (remainingSlots <= 0) {
      toast.error("Maximum 5 photos autorisées");
      return;
    }
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);
    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append("images[]", file));
    try {
      const { data } = await apiClient.post("/upload/images", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImageUrls((prev) => [...prev, ...data.data.urls].slice(0, MAX_PHOTOS));
      toast.success(`${filesToUpload.length} photo${filesToUpload.length > 1 ? "s" : ""} ajoutée${filesToUpload.length > 1 ? "s" : ""}`);
    } catch {
      toast.error("Erreur lors de l'upload. Vérifiez le format (JPG, PNG, WebP, max 5MB).");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files?.[0]) {
      handleImageUpload(event.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    toast.success("Photo supprimée");
  };

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
        location: { type: "Point", coordinates: [locationData.longitude, locationData.latitude] },
        address: { street: locationData.street || undefined, city: locationData.city, zip_code: locationData.zip_code },
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

  const canGoNext = (): boolean => {
    if (step === 1) return infoForm.formState.isValid;
    if (step === 2) return locationForm.formState.isValid;
    if (step === 3) return imageUrls.length > 0;
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Header ─────────────────────────────────────────── */}
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
              <StepIndicator currentStep={step} />
              <p className="text-xs text-muted-foreground">
                Étape {step} sur {STEPS.length} : {STEPS[step - 1].label}
              </p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* ─── Contenu principal ─────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {step === 1 && (
          <StepInfoForm
            form={infoForm}
            onValidSubmit={(data) => { setInfoData(data); setStep(2); }}
            canGoNext={canGoNext()}
          />
        )}
        {step === 2 && (
          <StepLocationForm
            form={locationForm}
            pinPosition={pinPosition}
            onMapClick={handleMapClick}
            onValidSubmit={(data) => { setLocationData(data); setStep(3); }}
            onBack={() => setStep(1)}
            canGoNext={canGoNext()}
          />
        )}
        {step === 3 && (
          <StepPhotosPanel
            imageUrls={imageUrls}
            uploading={uploading}
            publishing={publishing}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onFileChange={handleImageUpload}
            onRemoveImage={removeImage}
            onBack={() => setStep(2)}
            onPublish={handlePublish}
          />
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
