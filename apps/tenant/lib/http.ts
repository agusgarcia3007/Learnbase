import axios, { type InternalAxiosRequestConfig, AxiosError } from "axios";
import { getTenantFromHost, getResolvedSlug } from "@/lib/tenant";
import { isClient } from "@/lib/utils";
import { toast } from "sonner";

interface RequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REDIRECT_PATH_KEY = "redirectPath";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL;
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
  const tenantSlug = tenantInfo.slug || getResolvedSlug();
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
  const tenantSlug = tenantInfo.slug || getResolvedSlug();
  if (tenantSlug) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
  }

  return config;
});

async function refreshToken(): Promise<string | null> {
  const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshTokenValue) {
    return null;
  }

  const response = await publicHttp.post<{ accessToken: string }>("/auth/refresh", {
    refreshToken: refreshTokenValue,
  });

  return response.data.accessToken;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RequestConfigWithRetry | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshToken()
          .then((newToken) => {
            if (newToken) {
              localStorage.setItem(TOKEN_KEY, newToken);
            }
            isRefreshing = false;
            refreshPromise = null;
            return newToken;
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

      return refreshPromise!
        .then((newToken) => {
          if (!newToken) {
            return Promise.reject(error);
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return http(originalRequest);
        })
        .catch(() => {
          return Promise.reject(error);
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

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);

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
    refreshPromise = refreshToken()
      .then((newToken) => {
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken);
        }
        isRefreshing = false;
        refreshPromise = null;
        return newToken;
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

export function catchAxiosError(error: unknown, t?: (key: string) => string) {
  const defaultMessage = t ? t("common.unexpected_error") : "An unexpected error occurred";

  if (error instanceof AxiosError) {
    const errorCode = error.response?.data?.code;

    const message =
      errorCode && t
        ? t(`errors.${errorCode.toLowerCase()}`)
        : error.response?.data?.message || error.response?.data?.error || defaultMessage;

    toast.error(message);
    return;
  }

  toast.error(defaultMessage);
}
