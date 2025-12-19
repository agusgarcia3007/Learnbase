import { describe, it, expect, mock, beforeEach, beforeAll } from "bun:test";
import { Elysia } from "elysia";
import { createRequest, jsonRequest, getRequest, parseJsonResponse } from "../helpers/request";
import { errorHandler } from "@/lib/errors";

declare global {
  var mockEnrollmentStore: {
    enrollments: any[];
    courses: any[];
    cartItems: any[];
    currentUser: any;
  };
}

globalThis.mockEnrollmentStore = {
  enrollments: [],
  courses: [],
  cartItems: [],
  currentUser: null,
};

function getTableName(table: any): string {
  return table?.[Symbol.for("drizzle:Name")] || table?._?.name || "";
}

function createSelectMock(fields?: any) {
  const isCountQuery = fields && fields.total;

  return {
    from: (table: any) => {
      const name = getTableName(table);

      const getDataForTable = () => {
        if (name.includes("enrollment")) {
          return globalThis.mockEnrollmentStore.enrollments;
        }
        if (name.includes("course") && !name.includes("category")) {
          return globalThis.mockEnrollmentStore.courses;
        }
        if (name.includes("category")) {
          return [];
        }
        return [];
      };

      const whereResult: any = {
        limit: (n: number) => Promise.resolve(getDataForTable().slice(0, n)),
        orderBy: () => ({
          limit: (n: number) => ({
            offset: () => Promise.resolve(getDataForTable().slice(0, n)),
          }),
        }),
        then: (resolve: any) => Promise.resolve(getDataForTable()).then(resolve),
      };

      if (isCountQuery) {
        return {
          where: () => Promise.resolve([{ total: globalThis.mockEnrollmentStore.enrollments.length }]),
        };
      }

      const innerJoinWhereResult: any = {
        limit: () => Promise.resolve([]),
        then: (resolve: any) => Promise.resolve([]).then(resolve),
      };

      return {
        where: () => whereResult,
        innerJoin: () => ({
          where: () => innerJoinWhereResult,
          leftJoin: () => ({
            leftJoin: () => ({
              leftJoin: () => ({
                where: () => ({
                  orderBy: () => ({
                    limit: (n: number) => ({
                      offset: () => {
                        const enrollments = globalThis.mockEnrollmentStore.enrollments.map((e) => {
                          const course = globalThis.mockEnrollmentStore.courses.find(
                            (c) => c.id === e.courseId
                          );
                          return {
                            enrollment: e,
                            course: course || { id: e.courseId, title: "Course", slug: "course" },
                            modulesCount: 5,
                            instructor: { name: "Instructor", avatar: null },
                          };
                        });
                        return Promise.resolve(enrollments.slice(0, n));
                      },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
        groupBy: () => ({
          as: () => ({}),
        }),
      };
    },
  };
}

mock.module("@/db", () => ({
  db: {
    select: createSelectMock,
    insert: (table: any) => ({
      values: (values: any) => ({
        returning: () => {
          const name = getTableName(table);
          const items = Array.isArray(values) ? values : [values];
          const results: any[] = [];

          for (const val of items) {
            const item = { id: `mock-${Date.now()}-${Math.random()}`, createdAt: new Date(), ...val };
            if (name.includes("enrollment")) {
              globalThis.mockEnrollmentStore.enrollments.push(item);
            }
            results.push(item);
          }
          return Promise.resolve(results);
        },
        onConflictDoNothing: () => ({
          returning: () => {
            const name = getTableName(table);
            const items = Array.isArray(values) ? values : [values];
            const results: any[] = [];

            for (const val of items) {
              const existingEnrollment = globalThis.mockEnrollmentStore.enrollments.find(
                (e) => e.userId === val.userId && e.courseId === (val.courseId?.toString?.() || val.courseId)
              );
              if (!existingEnrollment) {
                const validCourse = globalThis.mockEnrollmentStore.courses.find(
                  (c) => c.status === "published"
                );
                if (validCourse || val.courseId) {
                  const item = {
                    id: `mock-${Date.now()}`,
                    createdAt: new Date(),
                    userId: val.userId,
                    courseId: validCourse?.id || val.courseId,
                    tenantId: val.tenantId,
                    status: "active",
                    progress: 0,
                  };
                  globalThis.mockEnrollmentStore.enrollments.push(item);
                  results.push(item);
                }
              }
            }
            return Promise.resolve(results);
          },
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    delete: (table: any) => ({
      where: () => ({
        returning: () => {
          const name = getTableName(table);
          if (name.includes("enrollment")) {
            const deleted = globalThis.mockEnrollmentStore.enrollments.shift();
            return Promise.resolve(deleted ? [deleted] : []);
          }
          if (name.includes("cart")) {
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        },
      }),
    }),
  },
}));

mock.module("@/jobs", () => ({
  enqueue: () => Promise.resolve(),
}));

mock.module("@/lib/upload", () => ({
  getPresignedUrl: (key: string) => `https://cdn.example.com/${key}`,
}));

mock.module("@/plugins/auth", () => ({
  authPlugin: new Elysia({ name: "auth" }).derive({ as: "scoped" }, () => ({
    user: globalThis.mockEnrollmentStore.currentUser,
    userId: globalThis.mockEnrollmentStore.currentUser?.id,
    userRole: globalThis.mockEnrollmentStore.currentUser?.role,
    effectiveTenantId: globalThis.mockEnrollmentStore.currentUser?.tenantId,
  })),
  invalidateUserCache: () => {},
}));

function clearMocks() {
  globalThis.mockEnrollmentStore.enrollments = [];
  globalThis.mockEnrollmentStore.courses = [];
  globalThis.mockEnrollmentStore.cartItems = [];
  globalThis.mockEnrollmentStore.currentUser = null;
}

function setCurrentUser(user: any) {
  globalThis.mockEnrollmentStore.currentUser = user;
}

function addCourse(course: any) {
  globalThis.mockEnrollmentStore.courses.push(course);
}

function addEnrollment(enrollment: any) {
  globalThis.mockEnrollmentStore.enrollments.push(enrollment);
}

describe("Enrollments Routes", () => {
  let app: any;

  beforeAll(async () => {
    const { enrollmentsRoutes } = await import("@/routes/tenant/enrollments");
    app = new Elysia().use(errorHandler).use(enrollmentsRoutes);
  });

  beforeEach(() => {
    clearMocks();
  });

  describe("GET /", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(getRequest("/"));
      expect(response.status).toBe(401);
    });

    it("returns 404 if user has no tenant", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: null });
      const response = await app.handle(getRequest("/"));
      expect(response.status).toBe(404);
    });

    it("returns empty list when no enrollments", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(getRequest("/"));
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.enrollments).toEqual([]);
    });

    it("returns paginated enrollments list", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      addCourse({ id: "course-1", title: "Course 1", slug: "course-1", status: "published" });
      addEnrollment({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "course-1",
        tenantId: "tenant-1",
        status: "active",
        progress: 50,
      });

      const response = await app.handle(getRequest("/"));
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.enrollments.length).toBe(1);
      expect(data.pagination).toBeDefined();
    });

    it("supports pagination parameters", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(getRequest("/?page=2&limit=10"));
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.pagination).toBeDefined();
    });
  });

  describe("POST /", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        jsonRequest("/", { courseId: "550e8400-e29b-41d4-a716-446655440000" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 404 if user has no tenant", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: null });
      const response = await app.handle(
        jsonRequest("/", { courseId: "550e8400-e29b-41d4-a716-446655440000" })
      );
      expect(response.status).toBe(404);
    });

    it("enrolls user in a published course", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      addCourse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Test Course",
        tenantId: "tenant-1",
        status: "published",
      });

      const response = await app.handle(
        jsonRequest("/", { courseId: "550e8400-e29b-41d4-a716-446655440000" })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.enrollment).toBeDefined();
    });

    it("returns 400 for invalid UUID", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(
        jsonRequest("/", { courseId: "invalid-uuid" })
      );
      expect(response.status).toBe(400);
    });
  });

  describe("GET /:courseId", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        getRequest("/550e8400-e29b-41d4-a716-446655440000")
      );
      expect(response.status).toBe(401);
    });

    it("returns isEnrolled=false when not enrolled", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(
        getRequest("/550e8400-e29b-41d4-a716-446655440000")
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.isEnrolled).toBe(false);
      expect(data.enrollment).toBeNull();
    });
  });

  describe("POST /batch", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        jsonRequest("/batch", { courseIds: ["550e8400-e29b-41d4-a716-446655440000"] })
      );
      expect(response.status).toBe(401);
    });

    it("returns empty array for empty courseIds", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(
        jsonRequest("/batch", { courseIds: [] })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.enrollments).toEqual([]);
    });

    it("enrolls in multiple valid courses", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      addCourse({
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Course 1",
        tenantId: "tenant-1",
        status: "published",
      });
      addCourse({
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "Course 2",
        tenantId: "tenant-1",
        status: "published",
      });

      const response = await app.handle(
        jsonRequest("/batch", {
          courseIds: [
            "550e8400-e29b-41d4-a716-446655440001",
            "550e8400-e29b-41d4-a716-446655440002",
          ],
        })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.enrollments).toBeDefined();
    });
  });

  describe("DELETE /:courseId", () => {
    it("returns 401 if not authenticated", async () => {
      const response = await app.handle(
        createRequest("/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 404 if user has no tenant", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: null });
      const response = await app.handle(
        createRequest("/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
      );
      expect(response.status).toBe(404);
    });

    it("unenrolls from a course", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      addEnrollment({
        id: "enrollment-1",
        userId: "user-1",
        courseId: "550e8400-e29b-41d4-a716-446655440000",
        tenantId: "tenant-1",
      });

      const response = await app.handle(
        createRequest("/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
      );
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.success).toBe(true);
    });

    it("returns 404 if enrollment not found", async () => {
      setCurrentUser({ id: "user-1", role: "student", tenantId: "tenant-1" });
      const response = await app.handle(
        createRequest("/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE" })
      );
      expect(response.status).toBe(404);
    });
  });
});
