export type SendWelcomeEmailJob = {
  type: "send-welcome-email";
  data: {
    email: string;
    userName: string;
    verificationToken: string;
    clientUrl: string;
  };
};

export type CreateStripeCustomerJob = {
  type: "create-stripe-customer";
  data: {
    tenantId: string;
    email: string;
    name: string;
    slug: string;
  };
};

export type SendTenantWelcomeEmailJob = {
  type: "send-tenant-welcome-email";
  data: {
    email: string;
    userName: string;
    tenantName: string;
    dashboardUrl: string;
    logoUrl?: string;
  };
};

export type Job = SendWelcomeEmailJob | CreateStripeCustomerJob | SendTenantWelcomeEmailJob;
