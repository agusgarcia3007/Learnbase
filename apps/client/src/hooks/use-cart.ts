import { useGetCart, useAddToCart, useRemoveFromCart, useClearCart } from "@/services/cart";
import { useCreateCheckoutSession } from "@/services/checkout";
import { toast } from "sonner";

export const useCart = () => {
  const isAuthenticated = typeof window !== "undefined" && !!localStorage.getItem("accessToken");

  const { data: cartData, isLoading } = useGetCart({ enabled: isAuthenticated });
  const { mutate: addToCartMutation, isPending: isAdding } = useAddToCart();
  const { mutate: removeFromCartMutation, isPending: isRemoving } = useRemoveFromCart();
  const { mutate: clearCartMutation, isPending: isClearing } = useClearCart();
  const { mutate: checkoutMutation, isPending: isCheckingOut } = useCreateCheckoutSession();

  const addToCart = (courseId: string) => {
    addToCartMutation(courseId);
  };

  const removeFromCart = (courseId: string) => {
    removeFromCartMutation(courseId);
  };

  const clearCart = () => {
    clearCartMutation();
  };

  const checkout = () => {
    const courseIds = cartData?.items.map((item) => item.courseId) ?? [];
    if (courseIds.length > 0) {
      checkoutMutation(courseIds, {
        onSuccess: (data) => {
          if (data.type === "checkout" && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else if (data.type === "free") {
            toast.success(data.message);
          }
        },
      });
    }
  };

  const buyNow = (courseId: string) => {
    checkoutMutation([courseId], {
      onSuccess: (data) => {
        if (data.type === "checkout" && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else if (data.type === "free") {
          toast.success(data.message);
        }
      },
    });
  };

  const isInCart = (courseId: string): boolean => {
    return cartData?.items.some((item) => item.courseId === courseId) ?? false;
  };

  const defaultSummary = {
    itemCount: 0,
    total: 0,
    originalTotal: 0,
    currency: "USD",
  };

  return {
    items: cartData?.items ?? [],
    summary: cartData?.summary ?? defaultSummary,
    itemCount: cartData?.summary?.itemCount ?? 0,
    isLoading,
    isPending: isAdding || isRemoving || isClearing,
    isCheckingOut,
    isAuthenticated,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    buyNow,
    isInCart,
  };
};
