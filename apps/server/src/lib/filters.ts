import {
  SQL,
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  not,
  notInArray,
  or,
  type AnyColumn,
} from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

export type SortOrder = "asc" | "desc";

export type SortParams = {
  field: string;
  order: SortOrder;
};

export type ListParams = {
  page: number;
  limit: number;
  sort?: SortParams;
  search?: string;
  filters: Record<string, string | undefined>;
};

export type FilterOperator = "is" | "is_not" | "contains" | "not_contains";

export type PaginationResult = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationResult;
};

export type FieldMap<T extends PgTable> = {
  [key: string]: AnyColumn;
};

export type SearchableFields<T extends PgTable> = AnyColumn[];

export type DateFields = Set<string>;

export function parseFilterValue(value: string): {
  operator: FilterOperator;
  rawValue: string;
} {
  const operatorMatch = value.match(/^(is_not|is|not_contains|contains):(.+)$/);
  if (operatorMatch) {
    return {
      operator: operatorMatch[1] as FilterOperator,
      rawValue: operatorMatch[2],
    };
  }
  return { operator: "is", rawValue: value };
}

export function buildTextFilter(
  value: string | undefined,
  column: AnyColumn
): SQL | undefined {
  if (!value) return undefined;
  const { operator, rawValue } = parseFilterValue(value);
  switch (operator) {
    case "contains":
    case "is":
      return ilike(column, `%${rawValue}%`);
    case "not_contains":
    case "is_not":
      return not(ilike(column, `%${rawValue}%`));
    default:
      return ilike(column, `%${rawValue}%`);
  }
}

export function parseListParams(
  query: Record<string, string | undefined>
): ListParams {
  const page = Math.max(1, parseInt(query.page ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "10", 10)));

  let sort: SortParams | undefined;
  if (query.sort) {
    const [field, order] = query.sort.split(":");
    if (field && (order === "asc" || order === "desc")) {
      sort = { field, order };
    }
  }

  const reservedKeys = ["page", "limit", "sort", "search"];
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (!reservedKeys.includes(key) && value !== undefined && value !== "") {
      filters[key] = value;
    }
  }

  return {
    page,
    limit,
    sort,
    search: query.search,
    filters,
  };
}

export function buildSearchCondition<T extends PgTable>(
  searchValue: string,
  searchableFields: SearchableFields<T>
): SQL | undefined {
  if (!searchValue || searchableFields.length === 0) {
    return undefined;
  }

  const searchPattern = `%${searchValue}%`;
  const conditions = searchableFields.map((field) =>
    ilike(field, searchPattern)
  );

  return conditions.length === 1 ? conditions[0] : or(...conditions);
}

function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
}

function parseDateEnd(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return undefined;
  date.setHours(23, 59, 59, 999);
  return date;
}

export function buildFilterConditions<T extends PgTable>(
  filters: Record<string, string | undefined>,
  fieldMap: FieldMap<T>,
  dateFields?: DateFields
): SQL[] {
  const conditions: SQL[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === "") continue;

    const column = fieldMap[key];
    if (!column) continue;

    const { operator, rawValue } = parseFilterValue(value);

    if (dateFields?.has(key) && rawValue.includes(",")) {
      const [fromStr, toStr] = rawValue.split(",");
      const fromDate = parseDate(fromStr);
      const toDate = parseDateEnd(toStr);
      if (fromDate) {
        conditions.push(gte(column, fromDate));
      }
      if (toDate) {
        conditions.push(lte(column, toDate));
      }
    } else if (rawValue.includes(",")) {
      const values = rawValue.split(",").filter(Boolean);
      if (values.length > 0) {
        if (operator === "is_not") {
          conditions.push(notInArray(column, values));
        } else {
          conditions.push(inArray(column, values));
        }
      }
    } else {
      switch (operator) {
        case "is":
          conditions.push(eq(column, rawValue));
          break;
        case "is_not":
          conditions.push(not(eq(column, rawValue)));
          break;
        case "contains":
          conditions.push(ilike(column, `%${rawValue}%`));
          break;
        case "not_contains":
          conditions.push(not(ilike(column, `%${rawValue}%`)));
          break;
      }
    }
  }

  return conditions;
}

export function buildWhereClause<T extends PgTable>(
  params: ListParams,
  fieldMap: FieldMap<T>,
  searchableFields: SearchableFields<T>,
  dateFields?: DateFields
): SQL | undefined {
  const conditions: SQL[] = [];

  if (params.search) {
    const searchCondition = buildSearchCondition(
      params.search,
      searchableFields
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const filterConditions = buildFilterConditions(
    params.filters,
    fieldMap,
    dateFields
  );
  conditions.push(...filterConditions);

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function getSortColumn(
  sort: SortParams | undefined,
  fieldMap: FieldMap<PgTable>,
  defaultSort?: { field: string; order: SortOrder }
): SQL | undefined {
  const sortToApply = sort ?? defaultSort;
  if (!sortToApply) {
    return undefined;
  }

  const column = fieldMap[sortToApply.field];
  if (!column) {
    return undefined;
  }

  return sortToApply.order === "desc" ? desc(column) : asc(column);
}

export function getPaginationParams(page: number, limit: number) {
  return {
    limit,
    offset: (page - 1) * limit,
  };
}

export function calculatePagination(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
