declare module 'react-window' {
  import { ComponentType } from 'react';

  interface FixedSizeGridProps {
    columnCount: number;
    columnWidth: number;
    height: number | string;
    rowCount: number;
    rowHeight: number;
    width: number | string;
    className?: string;
    style?: React.CSSProperties;
    children: ComponentType<{
      columnIndex: number;
      rowIndex: number;
      style: React.CSSProperties;
    }>;
    overscanColumnsCount?: number;
    overscanRowsCount?: number;
    useIsScrolling?: boolean;
    onItemsRendered?: (params: {
      overscanColumnStartIndex: number;
      overscanColumnStopIndex: number;
      overscanRowStartIndex: number;
      overscanRowStopIndex: number;
      visibleColumnStartIndex: number;
      visibleColumnStopIndex: number;
      visibleRowStartIndex: number;
      visibleRowStopIndex: number;
    }) => void;
    onScroll?: (params: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    initialScrollLeft?: number;
    initialScrollTop?: number;
    innerRef?: React.Ref<HTMLDivElement>;
    outerRef?: React.Ref<HTMLDivElement>;
    outerElementType?: ComponentType<React.HTMLAttributes<HTMLDivElement>>;
    innerElementType?: ComponentType<React.HTMLAttributes<HTMLDivElement>>;
    innerTagName?: string;
    outerTagName?: string;
  }

  export const FixedSizeGrid: ComponentType<FixedSizeGridProps>;
}
