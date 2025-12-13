import axios from "axios";
import { AuthService } from "@/services/auth/service";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { isClient } from "@/lib/utils";

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REDIRECT_PATH_KEY = "redirectPath";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL;
};

export const http = axios.create({
  baseURL: getBaseUrl(),
});

export const publicHttp = axios.create({
  baseURL: getBaseUrl(),
});

publicHttp.interceptors.request.use((config) => {
  if (!isClient()) {
    return config;
  }

  const tenantInfo = getTenantFromHost();
  const tenantSlug = tenantInfo.slug || (tenantInfo.isCustomDomain ? getResolvedSlug() : null);
  if (tenantSlug) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
  }

  return config;
});

http.interceptors.request.use((config) => {
  if (!isClient()) {
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantInfo = getTenantFromHost();
  const tenantSlug = tenantInfo.slug || (tenantInfo.isCustomDomain ? getResolvedSlug() : null);
  if (tenantSlug) {
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

export async function ensureValidToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const bufferMs = 60 * 1000;

    if (expiresAt - now > bufferMs) {
      return token;
    }

    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = AuthService.refresh()
      .then((data) => {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        isRefreshing = false;
        refreshPromise = null;
        return data.accessToken;
      })
      .catch(() => {
        isRefreshing = false;
        refreshPromise = null;
        return null;
      });

    return refreshPromise;
  } catch {
    return token;
  }
}
