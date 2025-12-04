import { env } from "./env";

const RAILWAY_API_BASE = "https://backboard.railway.com/graphql/v2";

type GraphQLResponse<T> = {
  data: T;
  errors?: { message: string }[];
};

type ProjectToken = {
  projectToken: {
    projectId: string;
    environmentId: string;
  };
};

type CustomDomain = {
  id: string;
  domain: string;
};

type CustomDomainCreateResponse = {
  customDomainCreate: CustomDomain;
};

type CustomDomainDeleteResponse = {
  customDomainDelete: boolean;
};

let cachedProjectToken: ProjectToken["projectToken"] | null = null;

async function railwayRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(RAILWAY_API_BASE, {
    method: "POST",
    headers: {
      "Project-Access-Token": env.RAILWAY_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = (await response.json()) as GraphQLResponse<T>;

  if (data.errors?.length) {
    const errorMessage = data.errors.map((e) => e.message).join(", ");
    throw new Error(`Railway API error: ${errorMessage}`);
  }

  return data.data;
}

async function getProjectToken(): Promise<ProjectToken["projectToken"]> {
  if (cachedProjectToken) {
    return cachedProjectToken;
  }

  const query = `query { projectToken { projectId environmentId } }`;
  const result = await railwayRequest<ProjectToken>(query);
  cachedProjectToken = result.projectToken;
  return cachedProjectToken;
}

export async function createRailwayCustomDomain(domain: string): Promise<CustomDomain> {
  const { environmentId } = await getProjectToken();

  const query = `
    mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
      }
    }
  `;

  const variables = {
    input: {
      domain,
      environmentId,
      serviceId: env.RAILWAY_CLIENT_SERVICE_ID,
    },
  };

  const result = await railwayRequest<CustomDomainCreateResponse>(query, variables);
  return result.customDomainCreate;
}

export async function deleteRailwayCustomDomain(domainId: string): Promise<void> {
  const query = `
    mutation customDomainDelete($id: String!) {
      customDomainDelete(id: $id)
    }
  `;

  await railwayRequest<CustomDomainDeleteResponse>(query, { id: domainId });
}
