import { createCollection } from "@tanstack/react-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { queryClient } from "@/lib/db";
import {
  TenantsService,
  tenantSchema,
  QUERY_KEYS,
  type UpdateTenantRequest,
} from "@/services/tenants/service";

export const tenantsCollection = createCollection(
  queryCollectionOptions({
    id: "tenants",
    queryKey: QUERY_KEYS.TENANTS,
    queryFn: async () => {
      const result = await TenantsService.list();
      return result.tenants;
    },
    queryClient,
    getKey: (tenant) => tenant.id,
    schema: tenantSchema,
    refetchInterval: 5000,

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      const payload: UpdateTenantRequest = {
        name: changes.name ?? original.name,
        slug: changes.slug ?? original.slug,
        theme: changes.theme !== undefined ? changes.theme : original.theme,
        description:
          changes.description !== undefined
            ? changes.description
            : original.description,
        contactEmail:
          changes.contactEmail !== undefined
            ? changes.contactEmail
            : original.contactEmail,
        contactPhone:
          changes.contactPhone !== undefined
            ? changes.contactPhone
            : original.contactPhone,
        contactAddress:
          changes.contactAddress !== undefined
            ? changes.contactAddress
            : original.contactAddress,
        socialLinks:
          changes.socialLinks !== undefined
            ? changes.socialLinks
            : original.socialLinks,
        seoTitle:
          changes.seoTitle !== undefined ? changes.seoTitle : original.seoTitle,
        seoDescription:
          changes.seoDescription !== undefined
            ? changes.seoDescription
            : original.seoDescription,
        seoKeywords:
          changes.seoKeywords !== undefined
            ? changes.seoKeywords
            : original.seoKeywords,
        heroTitle:
          changes.heroTitle !== undefined
            ? changes.heroTitle
            : original.heroTitle,
        heroSubtitle:
          changes.heroSubtitle !== undefined
            ? changes.heroSubtitle
            : original.heroSubtitle,
        heroCta:
          changes.heroCta !== undefined ? changes.heroCta : original.heroCta,
        footerText:
          changes.footerText !== undefined
            ? changes.footerText
            : original.footerText,
        showHeaderName:
          changes.showHeaderName !== undefined
            ? changes.showHeaderName
            : original.showHeaderName,
      };
      await TenantsService.update(original.id, payload);
    },

    onDelete: async ({ transaction }) => {
      const key = transaction.mutations[0].key;
      await TenantsService.delete(key as string);
    },
  })
);
