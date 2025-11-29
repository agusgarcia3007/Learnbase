import type { FilterI18nConfig, FilterOperator, FilterFieldConfig } from './filter-types';
import { DEFAULT_I18N } from './filter-i18n';

export const createOperatorsFromI18n = (i18n: FilterI18nConfig): Record<string, FilterOperator[]> => ({
  select: [
    { value: 'is', label: i18n.operators.is },
    { value: 'is_not', label: i18n.operators.isNot },
  ],
  multiselect: [
    { value: 'is', label: i18n.operators.is },
    { value: 'is_not', label: i18n.operators.isNot },
  ],
  date: [
    { value: 'is', label: i18n.operators.is },
    { value: 'before', label: i18n.operators.before },
    { value: 'after', label: i18n.operators.after },
  ],
  daterange: [{ value: 'between', label: i18n.operators.between }],
  text: [
    { value: 'contains', label: i18n.operators.contains },
    { value: 'is', label: i18n.operators.isExactly },
  ],
  number: [
    { value: 'equals', label: i18n.operators.equals },
    { value: 'greater_than', label: i18n.operators.greaterThan },
    { value: 'less_than', label: i18n.operators.lessThan },
  ],
  numberrange: [{ value: 'between', label: i18n.operators.between }],
  boolean: [{ value: 'is', label: i18n.operators.is }],
  email: [
    { value: 'contains', label: i18n.operators.contains },
    { value: 'is', label: i18n.operators.isExactly },
  ],
  url: [
    { value: 'contains', label: i18n.operators.contains },
    { value: 'is', label: i18n.operators.isExactly },
  ],
  tel: [
    { value: 'contains', label: i18n.operators.contains },
    { value: 'is', label: i18n.operators.isExactly },
  ],
  time: [
    { value: 'is', label: i18n.operators.is },
    { value: 'before', label: i18n.operators.before },
    { value: 'after', label: i18n.operators.after },
  ],
  datetime: [
    { value: 'is', label: i18n.operators.is },
    { value: 'before', label: i18n.operators.before },
    { value: 'after', label: i18n.operators.after },
  ],
});

export const DEFAULT_OPERATORS: Record<string, FilterOperator[]> = createOperatorsFromI18n(DEFAULT_I18N);

export const getOperatorsForField = <T = unknown>(
  field: FilterFieldConfig<T>,
  values: T[],
  i18n: FilterI18nConfig,
): FilterOperator[] => {
  if (field.operators) return field.operators;

  const operators = createOperatorsFromI18n(i18n);
  let fieldType = field.type || 'select';

  if (fieldType === 'select' && values.length > 1) {
    fieldType = 'multiselect';
  }

  if (fieldType === 'multiselect' || field.type === 'multiselect') {
    return operators.multiselect;
  }

  return operators[fieldType] || operators.select;
};
