export type NotifySeverity = 'info' | 'success' | 'warning' | 'error' | 'security';

export type NotifyInput = {
  severity: NotifySeverity;
  title: string;
  message: string;
  persist?: boolean;
};

export type ConfirmInput = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export type PromptInput = {
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
};

export type NotificationItem = NotifyInput & {
  id: string;
  createdAt: number;
};
