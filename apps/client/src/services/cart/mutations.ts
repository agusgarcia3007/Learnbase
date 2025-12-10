import { useMutation } from "@tanstack/react-query";
import { useAddToCartOptions, useRemoveFromCartOptions, useClearCartOptions, useCheckoutOptions } from "./options";

export const useAddToCart = () => useMutation(useAddToCartOptions());

export const useRemoveFromCart = () => useMutation(useRemoveFromCartOptions());

export const useClearCart = () => useMutation(useClearCartOptions());

export const useCheckout = () => useMutation(useCheckoutOptions());
