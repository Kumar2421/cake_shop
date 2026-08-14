"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { ChevronDown, Loader2, LocateFixed, MapPin, Search } from "lucide-react";

import {
  clearDeliveryLocation,
  detectDeliveryLocation,
  getCityPincodes,
  getServiceableCities,
  setDeliveryLocation,
  type DeliveryLocation,
} from "@/lib/delivery/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LOCATION_COOKIE = "delivery_location";

/** Raw cookie value the server action wrote; it is intentionally not httpOnly. */
function readCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCATION_COOKIE}=`));

  return match ? match.slice(LOCATION_COOKIE.length + 1) : null;
}

// Cookies emit no change event, so there is nothing to subscribe to; the value
// only changes through this component, which tracks it in state as well.
const noopSubscribe = () => () => {};

/**
 * Reads the saved area without setting state in an effect.
 *
 * The server has no access to the cookie during static rendering, so the server
 * snapshot is null and the real value arrives on hydration.
 */
function useStoredLocation(): DeliveryLocation | null {
  const raw = useSyncExternalStore(noopSubscribe, readCookie, () => null);

  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(decodeURIComponent(raw)) as DeliveryLocation;
    } catch {
      return null;
    }
  }, [raw]);
}

interface CityOption {
  city: string;
  pincode: string;
  areaCount: number;
}

export function LocationPicker({ fallbackLabel }: { fallbackLabel: string }) {
  const stored = useStoredLocation();
  const [open, setOpen] = useState(false);
  // undefined means "no change this session", so the cookie value shows through.
  const [chosen, setChosen] = useState<DeliveryLocation | null | undefined>(undefined);
  const location = chosen === undefined ? stored : chosen;
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [cityPincodes, setCityPincodes] = useState<string[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || cities.length > 0) return;
    void getServiceableCities().then(setCities).catch(() => setCities([]));
  }, [open, cities.length]);

  const apply = useCallback((code: string) => {
    setError(null);
    startTransition(async () => {
      const result = await setDeliveryLocation(code);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setChosen(result.location ?? null);
      setOpen(false);
      setPincode("");
    });
  }, []);

  const detect = useCallback(() => {
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("This browser cannot share your location. Enter your pincode.");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        startTransition(async () => {
          const result = await detectDeliveryLocation(latitude, longitude);
          setDetecting(false);
          if (!result.ok) {
            setError(result.error ?? "Could not detect your location.");
            return;
          }
          setChosen(result.location ?? null);
          setOpen(false);
        });
      },
      (positionError) => {
        setDetecting(false);
        // Permission denial is a choice, not a fault — say what to do next
        // rather than reporting an error the user cannot act on.
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location access was blocked. Enter your pincode instead."
            : "Could not get your location. Enter your pincode instead.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  function toggleCity(city: string) {
    if (expandedCity === city) {
      setExpandedCity(null);
      return;
    }
    setExpandedCity(city);
    void getCityPincodes(city).then(setCityPincodes).catch(() => setCityPincodes([]));
  }

  const busy = isPending || detecting;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={
          location
            ? `Delivering to ${location.city} ${location.pincode}. Change location`
            : "Choose delivery location"
        }
        className="location-container-desktop ml-[33px] flex h-[26px] cursor-pointer items-center text-white outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <MapPin className="size-4 shrink-0" aria-hidden />
        <span className="location-text mx-[6px] ml-[8px] h-[26px] max-w-[220px] overflow-hidden text-[18px] font-[600] whitespace-nowrap text-white capitalize">
          {location ? `${location.city} ${location.pincode}` : fallbackLabel}
        </span>
        <ChevronDown className="mt-[3px] size-3 shrink-0" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Where should we deliver?</DialogTitle>
            <DialogDescription>
              Delivery times, fees and same-day availability depend on your area.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={detect}
              disabled={busy}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-brand-red bg-white px-4 text-sm font-semibold text-brand-red transition-colors hover:bg-brand-pink-tint focus-visible:ring-3 focus-visible:ring-brand-red/25 focus-visible:outline-none disabled:opacity-50"
            >
              {detecting ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <LocateFixed className="size-4" aria-hidden />
              )}
              {detecting ? "Finding you…" : "Use my current location"}
            </button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-hairline" />
              <span className="text-xs font-medium text-ink-muted">or</span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply(pincode);
              }}
              className="flex flex-col gap-1.5"
            >
              <label htmlFor="pincode-input" className="text-sm font-medium text-ink-soft">
                Enter your pincode
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden
                  />
                  <input
                    id="pincode-input"
                    value={pincode}
                    onChange={(event) => {
                      setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
                      setError(null);
                    }}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    placeholder="641001"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "pincode-error" : undefined}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-white pr-3 pl-9 text-base text-ink outline-none transition-colors",
                      "focus-visible:border-brand-red focus-visible:ring-3 focus-visible:ring-brand-red/20",
                      error ? "border-destructive" : "border-hairline",
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || pincode.length !== 6}
                  className="h-11 cursor-pointer rounded-lg bg-brand-red px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-red-dark focus-visible:ring-3 focus-visible:ring-brand-red/25 focus-visible:outline-none disabled:opacity-50"
                >
                  {isPending ? "Checking…" : "Check"}
                </button>
              </div>
              {error && (
                <p id="pincode-error" role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </form>

            {cities.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-ink-soft">Cities we deliver to</p>
                <ul className="flex flex-col gap-1">
                  {cities.map((option) => (
                    <li key={option.city}>
                      <button
                        type="button"
                        onClick={() => toggleCity(option.city)}
                        aria-expanded={expandedCity === option.city}
                        className="flex min-h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm text-ink transition-colors hover:bg-brand-pink-tint focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:outline-none"
                      >
                        <span className="font-medium">{option.city}</span>
                        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                          {option.areaCount} areas
                          <ChevronDown
                            className={cn(
                              "size-3.5 transition-transform duration-200 motion-reduce:transition-none",
                              expandedCity === option.city && "rotate-180",
                            )}
                            aria-hidden
                          />
                        </span>
                      </button>

                      {expandedCity === option.city && (
                        <ul className="mt-1 mb-2 flex flex-wrap gap-1.5 px-3">
                          {cityPincodes.map((code) => (
                            <li key={code}>
                              <button
                                type="button"
                                onClick={() => apply(code)}
                                disabled={busy}
                                className="min-h-9 cursor-pointer rounded-full border border-hairline px-3 text-xs font-medium text-ink-soft transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/30 focus-visible:outline-none disabled:opacity-50"
                              >
                                {code}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {location && (
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await clearDeliveryLocation();
                    setChosen(null);
                    setOpen(false);
                  });
                }}
                className="min-h-11 cursor-pointer text-sm font-medium text-ink-muted underline-offset-4 hover:text-brand-red hover:underline"
              >
                Clear saved location
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
