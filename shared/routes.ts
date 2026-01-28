import { z } from 'zod';
import { insertAllowedStudentSchema, insertUserSchema, insertReservationSchema, users, schedules, reservations, allowedStudents } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  })
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        phoneNumber: z.string(),
        password: z.string()
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: z.object({
        phoneNumber: z.string(),
        password: z.string()
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        409: errorSchemas.conflict,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  schedules: {
    list: {
      method: 'GET' as const,
      path: '/api/schedules',
      responses: {
        200: z.array(z.custom<typeof schedules.$inferSelect & { currentCount: number, isReservedByUser: boolean }>()),
      },
    },
  },
  reservations: {
    create: {
      method: 'POST' as const,
      path: '/api/reservations',
      input: z.object({
        scheduleId: z.number().optional(),
        type: z.enum(['onsite', 'online']),
        content: z.string().optional(),
        photoUrls: z.array(z.string()).default([]),
      }),
      responses: {
        201: z.custom<typeof reservations.$inferSelect>(),
        400: errorSchemas.validation,
        409: errorSchemas.conflict,
        403: errorSchemas.forbidden,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/reservations',
      responses: {
        200: z.array(z.custom<typeof reservations.$inferSelect & { 
          studentName: string; 
          seatNumber: number; 
          day: string; 
          period: number; 
        }>()),
      },
    },
    myHistory: {
      method: 'GET' as const,
      path: '/api/reservations/history',
      responses: {
        200: z.array(z.custom<typeof reservations.$inferSelect & { 
          day: string; 
          period: number; 
        }>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/reservations/:id',
      input: z.object({
        content: z.string().optional(),
        photoUrls: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<typeof reservations.$inferSelect>(),
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reservations/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
        403: errorSchemas.forbidden,
      },
    }
  },
  admin: {
    allowedStudents: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/allowed-students',
        responses: {
          200: z.array(z.custom<typeof allowedStudents.$inferSelect>()),
        },
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/allowed-students',
        input: insertAllowedStudentSchema,
        responses: {
          201: z.custom<typeof allowedStudents.$inferSelect>(),
        },
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
