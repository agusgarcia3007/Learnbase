import { useCallback, useSyncExternalStore } from "react";

const GUEST_CART_KEY = "guestCart";

type GuestCartStore = {
  courseIds: string[];
};

const getSnapshot = (): string[] => {
  const stored = sessionStorage.getItem(GUEST_CART_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored) as GuestCartStore;
  return parsed.courseIds;
};

const getServerSnapshot = (): string[] => [];

const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("guestCartChange", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("guestCartChange", callback);
  };
};

const notifyChange = () => {
  window.dispatchEvent(new Event("guestCartChange"));
};

export const useGuestCart = () => {
  const courseIds = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addToGuestCart = useCallback((courseId: string) => {
    const current = getSnapshot();
    if (current.includes(courseId)) return false;
    const updated: GuestCartStore = { courseIds: [...current, courseId] };
    sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
    notifyChange();
    return true;
  }, []);

  const removeFromGuestCart = useCallback((courseId: string) => {
    const current = getSnapshot();
    const updated: GuestCartStore = { courseIds: current.filter((id) => id !== courseId) };
    sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(updated));
    notifyChange();
  }, []);

  const clearGuestCart = useCallback(() => {
    sessionStorage.removeItem(GUEST_CART_KEY);
    notifyChange();
  }, []);

  const isInGuestCart = useCallback(
    (courseId: string) => courseIds.includes(courseId),
    [courseIds]
  );

  return {
    courseIds,
    itemCount: courseIds.length,
    addToGuestCart,
    removeFromGuestCart,
    clearGuestCart,
    isInGuestCart,
  };
};

export const getGuestCartCourseIds = (): string[] => {
  const stored = sessionStorage.getItem(GUEST_CART_KEY);
  if (!stored) return [];
  const parsed = JSON.parse(stored) as GuestCartStore;
  return parsed.courseIds;
};

export const clearGuestCartStorage = () => {
  sessionStorage.removeItem(GUEST_CART_KEY);
};
