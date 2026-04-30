import type { ReactNode, DragEvent, MouseEvent } from 'react';

/**
 * SidebarItem 展示数据
 */
export interface SidebarItemData {
  name: string;
  icon?: ReactNode;
  count?: number;
  missingIcon?: ReactNode;
}

/**
 * SidebarItem 交互状态
 */
export interface SidebarItemState {
  isSelected?: boolean;
  isDisabled?: boolean;
  isMissing?: boolean;
  isDragOver?: boolean;
  isForbidden?: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  editingValue?: string;
  indentLevel?: 0 | 1 | 2;
}

/**
 * SidebarItem 事件处理
 */
export interface SidebarItemHandlers {
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: DragEvent) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  onEditClick?: (e: MouseEvent) => void;
}

/**
 * SidebarItem 组合 Props
 *
 * 将原有的 24 个 props 组合为 3 个对象，简化组件接口
 */
export interface SidebarItemProps {
  /** 展示数据 */
  data: SidebarItemData;
  /** 交互状态 */
  state?: SidebarItemState;
  /** 事件处理 */
  handlers?: SidebarItemHandlers;
  /** 展开图标 */
  expandIcon?: ReactNode;
  /** ARIA 标签 */
  ariaLabel?: string;
  /** ARIA 展开状态 */
  ariaExpanded?: boolean;
  /** 自定义类名 */
  className?: string;
}