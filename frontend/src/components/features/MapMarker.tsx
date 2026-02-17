"use client";

interface MapMarkerProps {
  price: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Custom Marker — Rond noir avec le prix en blanc.
 * Au survol : scale up. Quand sélectionné : accent vert Roomshare.
 */
export function MapMarker({ price, isSelected, onClick }: MapMarkerProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-full px-3 py-1.5
        text-xs font-bold shadow-lg
        transition-all duration-200 ease-out
        hover:scale-110 hover:shadow-xl
        ${
          isSelected
            ? "scale-110 bg-accent text-accent-foreground ring-2 ring-accent/30"
            : "bg-primary text-primary-foreground hover:bg-gray-800"
        }
      `}
      style={{ transform: isSelected ? "scale(1.1)" : undefined }}
    >
      {price}&euro;
    </button>
  );
}
