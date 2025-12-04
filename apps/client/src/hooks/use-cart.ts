import { useGetCart, useAddToCart, useRemoveFromCart, useClearCart } from "@/services/cart";
import { useGuestCart } from "./use-guest-cart";

export const useCart = () => {
  const isAuthenticated = !!localStorage.getItem("accessToken");

  const { data: cartData, isLoading } = useGetCart({ enabled: isAuthenticated });
  const { mutate: addToCartMutation, isPending: isAdding } = useAddToCart();
  const { mutate: removeFromCartMutation, isPending: isRemoving } = useRemoveFromCart();
  const { mutate: clearCartMutation, isPending: isClearing } = useClearCart();

  const {
    courseIds: guestCourseIds,
    itemCount: guestItemCount,
    addToGuestCart,
    removeFromGuestCart,
    clearGuestCart,
    isInGuestCart,
  } = useGuestCart();

  const addToCart = (courseId: string) => {
    if (isAuthenticated) {
      addToCartMutation(courseId);
    } else {
      addToGuestCart(courseId);
    }
  };

  const removeFromCart = (courseId: string) => {
    if (isAuthenticated) {
      removeFromCartMutation(courseId);
    } else {
      removeFromGuestCart(courseId);
    }
  };

  const clearCart = () => {
    if (isAuthenticated) {
      clearCartMutation();
    } else {
      clearGuestCart();
    }
  };

  const isInCart = (courseId: string): boolean => {
    if (isAuthenticated) {
      return cartData?.items.some((item) => item.courseId === courseId) ?? false;
    }
    return isInGuestCart(courseId);
  };

  return {
    items: isAuthenticated ? cartData?.items ?? [] : [],
    summary: cartData?.summary ?? {
      itemCount: guestItemCount,
      total: 0,
      originalTotal: 0,
      currency: "USD",
    },
    itemCount: isAuthenticated ? cartData?.summary.itemCount ?? 0 : guestItemCount,
    isLoading: isAuthenticated ? isLoading : false,
    isPending: isAdding || isRemoving || isClearing,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    guestCourseIds: isAuthenticated ? [] : guestCourseIds,
  };
};
