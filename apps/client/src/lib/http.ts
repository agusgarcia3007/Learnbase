import axios from "axios";
import { AuthService } from "@/services/auth/service";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { isClient } from "@/lib/utils";

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REDIRECT_PATH_KEY = "redirectPath";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

http.interceptors.request.use((config) => {
  if (!isClient()) {
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const { slug, isCampus, isCustomDomain } = getTenantFromHost();
  const tenantSlug = isCustomDomain ? getResolvedSlug() : slug;
  if (isCampus && tenantSlug) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = AuthService.refresh()
          .then((data) => {
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            isRefreshing = false;
            refreshPromise = null;
            return data.accessToken;
          })
          .catch((refreshError) => {
            isRefreshing = false;
            refreshPromise = null;
            clearTokens();
            const currentPath = window.location.pathname + window.location.search;
            if (currentPath !== "/login") {
              sessionStorage.setItem(REDIRECT_PATH_KEY, currentPath);
            }
            window.location.href = "/login";
            return Promise.reject(refreshError);
          });
      }

      return refreshPromise!.then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      });
    }

    return Promise.reject(error);
  }
);

export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getRedirectPath = () => sessionStorage.getItem(REDIRECT_PATH_KEY);

export const clearRedirectPath = () => sessionStorage.removeItem(REDIRECT_PATH_KEY);
