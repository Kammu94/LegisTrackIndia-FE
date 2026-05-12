import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NotificationProvider, { useNotificationCenter, useNotify } from './NotificationProvider';

type DemoProps = {
  autoTrigger?: boolean;
};

const Demo = ({ autoTrigger }: DemoProps) => {
  const notify = useNotify();
  const { confirm, prompt } = useNotificationCenter();

  useEffect(() => {
    if (!autoTrigger) return;

    notify({
      severity: 'info',
      title: 'Information',
      message: 'This is an informational notification.',
    });
    notify({
      severity: 'success',
      title: 'Success',
      message: 'Changes saved successfully.',
    });
    notify({
      severity: 'warning',
      title: 'Warning',
      message: 'Please review the case details before proceeding.',
    });
    notify({
      severity: 'error',
      title: 'Critical Error',
      message: 'A critical error occurred. Please contact support if this continues.',
    });
    notify({
      severity: 'security',
      title: 'Security',
      message: 'Your session has expired. Please log in again.',
      persist: true,
    });
  }, [autoTrigger, notify]);

  return (
    <div className="min-h-[60vh] rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-legal-corporate">LegisTrack Notifications</h1>
      <p className="mt-2 text-sm text-gray-600">Trigger branded notifications using the global hook.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-[#003366] px-4 py-2 text-sm font-semibold text-white"
          onClick={() =>
            notify({
              severity: 'info',
              title: 'Information',
              message: 'This is an informational notification.',
            })
          }
        >
          Info
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#004D26] px-4 py-2 text-sm font-semibold text-white"
          onClick={() =>
            notify({
              severity: 'success',
              title: 'Success',
              message: 'Changes saved successfully.',
            })
          }
        >
          Success
        </button>
        <button
          type="button"
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white"
          onClick={() =>
            notify({
              severity: 'warning',
              title: 'Warning',
              message: 'Please review the case details before proceeding.',
            })
          }
        >
          Warning
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#990000] px-4 py-2 text-sm font-semibold text-white"
          onClick={() =>
            notify({
              severity: 'error',
              title: 'Critical Error',
              message: 'A critical error occurred. Please contact support if this continues.',
            })
          }
        >
          Error
        </button>
        <button
          type="button"
          className="rounded-xl bg-[#990000] px-4 py-2 text-sm font-semibold text-white"
          onClick={() =>
            notify({
              severity: 'security',
              title: 'Security',
              message: 'Your session has expired. Please log in again.',
              persist: true,
            })
          }
        >
          Security
        </button>
        <button
          type="button"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-legal-corporate hover:bg-gray-50"
          onClick={async () => {
            const ok = await confirm({
              title: 'Confirm Action',
              message: 'Do you want to continue?',
              confirmText: 'Continue',
              cancelText: 'Cancel',
            });
            notify({
              severity: ok ? 'success' : 'info',
              title: ok ? 'Confirmed' : 'Cancelled',
              message: ok ? 'Action confirmed.' : 'Action cancelled.',
            });
          }}
        >
          Confirm
        </button>
        <button
          type="button"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-legal-corporate hover:bg-gray-50"
          onClick={async () => {
            const value = await prompt({
              title: 'Prompt',
              message: 'Enter a note',
              placeholder: 'Type a note...',
              confirmText: 'Save',
              cancelText: 'Cancel',
            });
            if (value) {
              notify({
                severity: 'info',
                title: 'Saved',
                message: value,
              });
            }
          }}
        >
          Prompt
        </button>
      </div>
    </div>
  );
};

const meta: Meta<typeof NotificationProvider> = {
  title: 'System/Notifications',
  component: NotificationProvider,
  decorators: [
    (Story) => (
      <NotificationProvider>
        <Story />
      </NotificationProvider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof NotificationProvider>;

export const Desktop: Story = {
  render: () => <Demo autoTrigger />,
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
  },
};

export const Mobile: Story = {
  render: () => <Demo autoTrigger />,
  parameters: {
    viewport: {
      defaultViewport: 'iphone6',
    },
  },
};
