import { describe, it, expect, mock, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { jsonRequest, getRequest, parseJsonResponse } from "../helpers/request";
import { errorHandler } from "@/lib/errors";

declare global {
  var mockCheckoutStore: {
    courses: any[];
    enrollments: any[];
    payments: any[];
    paymentItems: any[];
    cartItems: any[];
    tenantCustomers: any[];
    currentUser: any;
    currentTenant: any;
    stripeSessions: any[];
    stripeConfigured: boolean;
  };
}

globalThis.mockCheckoutStore = {
  courses: [],
  enrollments: [],
  payments: [],
  paymentItems: [],
  cartItems: [],
  tenantCustomers: [],
  currentUser: null,
  currentTenant: null,
  stripeSessions: [],
  stripeConfigured: true,
};

function getTableName(table: any): string {
  return table?.[Symbol.for("drizzle:Name")] || table?._?.name || "";
}

function createCheckoutDbMock() {
  return {
    select: (fields?: any) => ({
      from: (table: any) => {
        const name = getTableName(table);

        const getDataForTable = () => {
          if (name.includes("course")) {
            return globalThis.mockCheckoutStore.courses;
          }
          if (name.includes("enrollment")) {
            return globalThis.mockCheckoutStore.enrollments;
          }
          if (name.includes("payment") && !name.includes("item")) {
            return globalThis.mockCheckoutStore.payments;
          }
          if (name.includes("tenant_customer")) {
            return globalThis.mockCheckoutStore.tenantCustomers;
          }
          return [];
        };

        const whereResult: any = {
          limit: (n: number) => Promise.resolve(getDataForTable().slice(0, n)),
          then: (resolve: any) => Promise.resolve(getDataForTable()).then(resolve),
        };

        return {
          where: () => whereResult,
        };
      },
    }),
    insert: (table: any) => ({
      values: (values: any) => ({
        returning: () => {
          const name = getTableName(table);
          const items = Array.isArray(values) ? values : [values];
          const results: any[] = [];

          for (const val of items) {
            const item = { id: `mock-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...val };
            if (name.includes("enrollment")) {
              globalThis.mockCheckoutStore.enrollments.push(item);
            } else if (name.includes("payment") && !name.includes("item")) {
              globalThis.mockCheckoutStore.payments.push(item);
            } else if (name.includes("payment_item")) {
              globalThis.mockCheckoutStore.paymentItems.push(item);
            }
            results.push(item);
          }
          return Promise.resolve(results);
        },
      }),
    }),
    update: (table: any) => ({
      set: (values: any) => ({
        where: () => {
          const name = getTableName(table);
          if (name.includes("payment") && !name.includes("item")) {
            const payment = globalThis.mockCheckoutStore.payments[0];
            if (payment) {
              Object.assign(payment, values);
            }
          }
          return Promise.resolve();
        },
      }),
    }),
    delete: (table: any) => ({
      where: () => {
        const name = getTableName(table);
        if (name.includes("cart")) {
          globalThis.mockCheckoutStore.cartItems = [];
        }
        return Promise.resolve();
      },
    }),
  };
}

mock.module("@/db", () => ({
  db: createCheckoutDbMock(),
}));

mock.module("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: async (params: any, options?: any) => {
          const session = {
            id: `cs_test_${Date.now()}`,
            url: "https://checkout.stripe.com/test-session",
            status: "open",
            payment_status: "unpaid",
          };
          globalThis.mockCheckoutStore.stripeSessions.push(session);
          return session;
        },
        retrieve: async (sessionId: string, options?: any) => {
          const session = globalThis.mockCheckoutStore.stripeSessions.find(
            (s) => s.id === sessionId
          );
          return session || { id: sessionId, status: "complete", payment_status: "paid" };
        },
      },
    },
  },
  isStripeConfigured: () => globalThis.mockCheckoutStore.stripeConfigured,
  calculatePlatformFee: (amount: number, rate: number) => Math.round(amount * (rate || 0.1)),
}));

mock.module("@/lib/utils", () => ({
  getTenantClientUrl: (tenant: any) =>
    tenant?.customDomain
      ? `https://${tenant.customDomain}`
      : `https://${tenant?.slug}.example.com`,
}));

mock.module("@/plugins/auth", () => ({
  authPlugin: new Elysia({ name: "auth" }).derive({ as: "scoped" }, () => ({
    user: globalThis.mockCheckoutStore.currentUser,
    userId: globalThis.mockCheckoutStore.currentUser?.id,
    userRole: globalThis.mockCheckoutStore.currentUser?.role,
  })),
  invalidateUserCache: () => {},
}));

mock.module("@/plugins/tenant", () => ({
  tenantPlugin: new Elysia({ name: "tenant" }).derive({ as: "scoped" }, () => ({
    tenant: globalThis.mockCheckoutStore.currentTenant,
  })),
  invalidateTenantCache: () => {},
  invalidateCustomDomainCache: () => {},
}));

function clearMocks() {
  globalThis.mockCheckoutStore.courses = [];
  globalThis.mockCheckoutStore.enrollments = [];
  globalThis.mockCheckoutStore.payments = [];
  globalThis.mockCheckoutStore.paymentItems = [];
  globalThis.mockCheckoutStore.cartItems = [];
  globalThis.mockCheckoutStore.tenantCustomers = [];
  globalThis.mockCheckoutStore.currentUser = null;
  globalThis.mockCheckoutStore.currentTenant = null;
  globalThis.mockCheckoutStore.stripeSessions = [];
  globalThis.mockCheckoutStore.stripeConfigured = true;
}

function setCurrentUser(user: any) {
  globalThis.mockCheckoutStore.currentUser = user;
}

function setCurrentTenant(tenant: any) {
  globalThis.mockCheckoutStore.currentTenant = tenant;
}

function addCourse(course: any) {
  globalThis.mockCheckoutStore.courses.push(course);
}

function addEnrollment(enrollment: any) {
  globalThis.mockCheckoutStore.enrollments.push(enrollment);
}

function addPayment(payment: any) {
  globalThis.mockCheckoutStore.payments.push(payment);
}

describe("Checkout Routes", () => {
  let app: any;

  beforeAll(async () => {
    const { checkoutRoutes } = await import("@/routes/tenant/checkout");
    app = new Elysia().use(errorHandler).use(checkoutRoutes);
  });

  beforeEach(() => {
    clearMocks();
  });

  describe("POST /session", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(401);
    });

    it("returns 401 if no tenant", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 if Stripe is not configured", async () => {
      globalThis.mockCheckoutStore.stripeConfigured = false;
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
        chargesEnabled: true,
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 if tenant has no Stripe account", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: null,
        chargesEnabled: false,
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 if no courses selected", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
        chargesEnabled: true,
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: [] })
      );
      expect(response.status).toBe(400);
    });

    it("enrolls immediately for free courses", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
        chargesEnabled: true,
      });
      addCourse({
        id: "course-1",
        title: "Free Course",
        price: 0,
        currency: "USD",
        tenantId: "tenant-1",
        status: "published",
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.type).toBe("free");
      expect(data.message).toContain("Enrolled");
    });

    it("creates Stripe session for paid courses", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
        chargesEnabled: true,
        commissionRate: 0.1,
      });
      addCourse({
        id: "course-1",
        title: "Paid Course",
        price: 2999,
        currency: "USD",
        tenantId: "tenant-1",
        status: "published",
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.type).toBe("checkout");
      expect(data.checkoutUrl).toBeDefined();
      expect(data.sessionId).toContain("cs_test_");
    });

    it("returns 400 if already enrolled in a course", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
        chargesEnabled: true,
      });
      addCourse({
        id: "course-1",
        title: "Course",
        price: 2999,
        currency: "USD",
        tenantId: "tenant-1",
        status: "published",
      });
      addEnrollment({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "course-1",
      });

      const response = await app.handle(
        jsonRequest("/session", { courseIds: ["course-1"] })
      );
      expect(response.status).toBe(400);
    });
  });

  describe("GET /session/:sessionId", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(getRequest("/session/cs_test_123"));
      expect(response.status).toBe(401);
    });

    it("returns 400 if Stripe is not configured", async () => {
      globalThis.mockCheckoutStore.stripeConfigured = false;
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
      });

      const response = await app.handle(getRequest("/session/cs_test_123"));
      expect(response.status).toBe(400);
    });

    it("returns session status", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({
        id: "tenant-1",
        slug: "acme",
        stripeConnectAccountId: "acct_123",
      });
      globalThis.mockCheckoutStore.stripeSessions.push({
        id: "cs_test_123",
        status: "complete",
        payment_status: "paid",
      });

      const response = await app.handle(getRequest("/session/cs_test_123"));
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.status).toBe("complete");
      expect(data.paymentStatus).toBe("paid");
    });
  });

  describe("GET /enrollment-status", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        getRequest("/enrollment-status?sessionId=cs_test_123")
      );
      expect(response.status).toBe(401);
    });

    it("returns 404 if payment not found", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({ id: "tenant-1", slug: "acme" });

      const response = await app.handle(
        getRequest("/enrollment-status?sessionId=cs_nonexistent")
      );
      expect(response.status).toBe(404);
    });

    it("returns pending status when no enrollments exist", async () => {
      setCurrentUser({ id: "user-1", email: "test@example.com" });
      setCurrentTenant({ id: "tenant-1", slug: "acme" });
      addPayment({
        id: "payment-1",
        stripeCheckoutSessionId: "cs_test_123",
        userId: "user-1",
        tenantId: "tenant-1",
        status: "completed",
      });

      const response = await app.handle(
        getRequest("/enrollment-status?sessionId=cs_test_123")
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.status).toBe("pending");
      expect(data.enrollmentCount).toBe(0);
    });
  });
});
