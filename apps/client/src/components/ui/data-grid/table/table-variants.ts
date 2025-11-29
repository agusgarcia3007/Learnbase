import { cva } from 'class-variance-authority';

export const headerCellSpacingVariants = cva('', {
  variants: {
    size: {
      dense: 'px-2.5 h-9',
      default: 'px-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export const bodyCellSpacingVariants = cva('', {
  variants: {
    size: {
      dense: 'px-2.5 py-2',
      default: 'px-4 py-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});
