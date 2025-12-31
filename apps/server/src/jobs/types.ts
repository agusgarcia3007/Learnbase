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
    locale?: string;
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

export type GenerateCourseEmbeddingJob = {
  type: "generate-course-embedding";
  data: {
    courseId: string;
    title: string;
    shortDescription: string | null;
    description: string | null;
  };
};

export type SendRevenueCatWelcomeEmailJob = {
  type: "send-revenuecat-welcome-email";
  data: {
    email: string;
    tenantName: string;
    resetUrl: string;
    tenantLogo: string | null;
    tenantContactEmail: string | null;
    locale?: string;
  };
};

export type VideoTranscriptJob = {
  type: "video-transcript";
  data: {
    videoId: string;
    videoKey: string;
    tenantId: string;
  };
};

export type VideoEmbeddingJob = {
  type: "video-embedding";
  data: {
    videoId: string;
    tenantId: string;
  };
};

export type SubtitleGenerationJob = {
  type: "subtitle-generation";
  data: {
    subtitleId: string;
    videoId: string;
    tenantId: string;
  };
};

export type SubtitleTranslationJob = {
  type: "subtitle-translation";
  data: {
    subtitleId: string;
    videoId: string;
    targetLanguage: string;
    tenantId: string;
  };
};

export type VideoAnalysisJob =
  | VideoTranscriptJob
  | VideoEmbeddingJob
  | SubtitleGenerationJob
  | SubtitleTranslationJob;

export type Job =
  | SendWelcomeEmailJob
  | CreateStripeCustomerJob
  | SendTenantWelcomeEmailJob
  | CreateConnectedCustomerJob
  | SyncConnectedCustomerJob
  | SendFeatureSubmissionEmailJob
  | SendFeatureApprovedEmailJob
  | SendFeatureRejectedEmailJob
  | GenerateCourseEmbeddingJob
  | SendRevenueCatWelcomeEmailJob
  | VideoAnalysisJob;
