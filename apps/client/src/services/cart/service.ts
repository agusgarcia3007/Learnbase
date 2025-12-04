import { http } from "@/lib/http";

export type CartCourseInstructor = {
  name: string;
  avatar: string | null;
};

export type CartCourseCategory = {
  name: string;
  slug: string;
};

export type CartCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  price: number;
  originalPrice: number | null;
  currency: string;
  instructor: CartCourseInstructor | null;
  category: CartCourseCategory | null;
};

export type CartItem = {
  id: string;
  courseId: string;
  createdAt: string;
  course: CartCourse;
};

export type CartSummary = {
  itemCount: number;
  total: number;
  originalTotal: number;
  currency: string;
};

export type CartResponse = {
  items: CartItem[];
  summary: CartSummary;
};

export type MergeCartResponse = {
  merged: number;
};

export const QUERY_KEYS = {
  CART: ["cart"] as const,
} as const;

export const CartService = {
  async getCart() {
    const { data } = await http.get<CartResponse>("/cart");
    return data;
  },

  async addToCart(courseId: string) {
    const { data } = await http.post<{ item: { id: string; courseId: string } }>(
      "/cart",
      { courseId }
    );
    return data;
  },

  async removeFromCart(courseId: string) {
    const { data } = await http.delete<{ success: boolean }>(`/cart/${courseId}`);
    return data;
  },

  async clearCart() {
    const { data } = await http.delete<{ success: boolean }>("/cart");
    return data;
  },

  async mergeCart(courseIds: string[]) {
    const { data } = await http.post<MergeCartResponse>("/cart/merge", { courseIds });
    return data;
  },
} as const;
