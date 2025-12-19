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

export type CreateConnectedCustomerJob = {
  type: "create-connected-customer";
  data: {
    userId: string;
    tenantId: string;
    email: string;
    name: string;
    stripeConnectAccountId: string;
  };
};

export type SyncConnectedCustomerJob = {
  type: "sync-connected-customer";
  data: {
    userId: string;
    email: string;
    name: string;
  };
};

export type SendFeatureSubmissionEmailJob = {
  type: "send-feature-submission-email";
  data: {
    email: string;
    userName: string;
    featureTitle: string;
  };
};

export type SendFeatureApprovedEmailJob = {
  type: "send-feature-approved-email";
  data: {
    email: string;
    userName: string;
    featureTitle: string;
    featuresUrl: string;
  };
};

export type SendFeatureRejectedEmailJob = {
  type: "send-feature-rejected-email";
  data: {
    email: string;
    userName: string;
    featureTitle: string;
    rejectionReason?: string;
  };
};

export type Job =
  | SendWelcomeEmailJob
  | CreateStripeCustomerJob
  | SendTenantWelcomeEmailJob
  | CreateConnectedCustomerJob
  | SyncConnectedCustomerJob
  | SendFeatureSubmissionEmailJob
  | SendFeatureApprovedEmailJob
  | SendFeatureRejectedEmailJob;
