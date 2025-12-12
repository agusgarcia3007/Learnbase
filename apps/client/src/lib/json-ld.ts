const BASE_URL = "https://uselearnbase.com";

type JsonLdScript = {
  type: "application/ld+json";
  children: string;
};

export function createOrganizationSchema(): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LearnBase",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Platform to create online academies with artificial intelligence",
    sameAs: [
      "https://twitter.com/learnbase",
      "https://linkedin.com/company/learnbase",
      "https://youtube.com/@learnbase",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Spanish", "Portuguese"],
    },
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createWebSiteSchema(): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LearnBase",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/courses?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createSoftwareApplicationSchema(): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LearnBase",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Create your online academy with artificial intelligence. Sell courses, manage students, and scale your educational business.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createCourseSchema({
  name,
  description,
  slug,
  image,
  price,
  currency = "USD",
  instructor,
  provider,
  duration,
  language = "en",
}: {
  name: string;
  description: string;
  slug: string;
  image?: string;
  price?: number;
  currency?: string;
  instructor?: {
    name: string;
    image?: string;
  };
  provider?: {
    name: string;
    url?: string;
  };
  duration?: string;
  language?: string;
}): JsonLdScript {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: `${BASE_URL}/courses/${slug}`,
    inLanguage: language,
  };

  if (image) {
    schema.image = image;
  }

  if (instructor) {
    schema.instructor = {
      "@type": "Person",
      name: instructor.name,
      ...(instructor.image && { image: instructor.image }),
    };
  }

  if (provider) {
    schema.provider = {
      "@type": "Organization",
      name: provider.name,
      ...(provider.url && { url: provider.url }),
    };
  }

  if (price !== undefined) {
    schema.offers = {
      "@type": "Offer",
      price: String(price),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    };
  }

  if (duration) {
    schema.timeRequired = duration;
  }

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}

export function createHowToSchema(): JsonLdScript {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to create your online academy with LearnBase",
    description: "Create your AI-powered online academy in 3 simple steps",
    totalTime: "PT10M",
    tool: [
      {
        "@type": "HowToTool",
        name: "LearnBase platform",
      },
    ],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Upload your content",
        text: "Upload your videos, documents, or any educational material. Our platform accepts multiple formats and organizes everything automatically.",
        url: `${BASE_URL}/#features`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "AI generates your courses",
        text: "Our AI analyzes your content, generates transcriptions, creates optimized titles and descriptions, and structures your courses automatically.",
        url: `${BASE_URL}/#features`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Launch your academy",
        text: "Customize your academy with your brand, connect your domain, set up payments, and start selling to students worldwide.",
        url: `${BASE_URL}/#features`,
      },
    ],
  };

  return {
    type: "application/ld+json",
    children: JSON.stringify(schema),
  };
}
