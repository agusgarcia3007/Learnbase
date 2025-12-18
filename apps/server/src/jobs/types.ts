type SendWelcomeEmailJob = {
  type: "send-welcome-email";
  data: {
    email: string;
    userName: string;
    verificationToken: string;
    clientUrl: string;
  };
};

type CreateStripeCustomerJob = {
  type: "create-stripe-customer";
  data: {
    tenantId: string;
    email: string;
    name: string;
    slug: string;
  };
};

export type Job = SendWelcomeEmailJob | CreateStripeCustomerJob;
