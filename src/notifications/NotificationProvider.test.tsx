import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import NotificationProvider, { useNotificationCenter, useNotify } from './NotificationProvider';

const TestHarness = () => {
  const notify = useNotify();
  return (
    <button
      type="button"
      onClick={() =>
        notify({
          severity: 'info',
          title: 'Info Title',
          message: 'Info message',
        })
      }
    >
      Trigger
    </button>
  );
};

const TestClearHarness = () => {
  const { notify, clear } = useNotificationCenter();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          notify({
            severity: 'success',
            title: 'Saved',
            message: 'Success message',
          })
        }
      >
        Add
      </button>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </div>
  );
};

describe('NotificationProvider', () => {
  it('throws when useNotify is used outside provider', () => {
    const Bad = () => {
      useNotify();
      return null;
    };

    expect(() => render(<Bad />)).toThrowError(/useNotify must be used within NotificationProvider/);
  });

  it('renders a toast and auto-dismisses info after 4000ms', () => {
    vi.useFakeTimers();

    render(
      <StrictMode>
        <NotificationProvider>
          <TestHarness />
        </NotificationProvider>
      </StrictMode>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3999);
    });
    expect(screen.getByText('Info Title')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.queryByText('Info Title')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('keeps error notifications persisted by default until dismissed', () => {
    vi.useFakeTimers();

    const ErrorHarness = () => {
      const notify = useNotify();
      return (
        <button
          type="button"
          onClick={() =>
            notify({
              severity: 'error',
              title: 'Critical',
              message: 'Will persist',
            })
          }
        >
          Trigger Error
        </button>
      );
    };

    render(
      <NotificationProvider>
        <ErrorHarness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Error' }));
    expect(screen.getByText('Critical')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByText('Critical')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Critical')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('clears all notifications', () => {
    render(
      <NotificationProvider>
        <TestClearHarness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('supports warning and security severities', () => {
    const Harness = () => {
      const notify = useNotify();
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              notify({
                severity: 'warning',
                title: 'Warning',
                message: 'Heads up',
              })
            }
          >
            Trigger Warning
          </button>
          <button
            type="button"
            onClick={() =>
              notify({
                severity: 'security',
                title: 'Security',
                message: 'Access issue',
                persist: true,
              })
            }
          >
            Trigger Security
          </button>
        </div>
      );
    };

    render(
      <NotificationProvider>
        <Harness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Warning' }));
    expect(screen.getByText('Warning')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Trigger Security' }));
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('does not auto-dismiss errors when persist is explicitly false and severity has no timeout', () => {
    vi.useFakeTimers();

    const Harness = () => {
      const notify = useNotify();
      return (
        <button
          type="button"
          onClick={() =>
            notify({
              severity: 'error',
              title: 'Non-timed Error',
              message: 'Should not start a timer',
              persist: false,
            })
          }
        >
          Trigger NonTimed
        </button>
      );
    };

    render(
      <NotificationProvider>
        <Harness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Trigger NonTimed' }));
    expect(screen.getByText('Non-timed Error')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Non-timed Error')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Non-timed Error')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('supports confirm dialogs', async () => {
    const Harness = () => {
      const { confirm, notify } = useNotificationCenter();
      return (
        <button
          type="button"
          onClick={async () => {
            const ok = await confirm({
              title: 'Confirm Delete',
              message: 'Are you sure?',
              confirmText: 'Delete',
              cancelText: 'Cancel',
            });
            if (ok) {
              notify({
                severity: 'success',
                title: 'Deleted',
                message: 'The item was deleted.',
              });
            }
          }}
        >
          Open Confirm
        </button>
      );
    };

    render(
      <NotificationProvider>
        <Harness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
    expect(screen.getByRole('dialog', { name: 'Confirm Delete' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Confirm Delete' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Confirm' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Deleted')).toBeInTheDocument();
  });

  it('supports prompt dialogs', async () => {
    const Harness = () => {
      const { prompt, notify } = useNotificationCenter();
      return (
        <button
          type="button"
          onClick={async () => {
            const value = await prompt({
              title: 'Add Note',
              message: 'Enter a note',
              placeholder: 'Type here',
              defaultValue: 'Initial',
              confirmText: 'Save',
              cancelText: 'Dismiss',
            });
            if (value) {
              notify({
                severity: 'info',
                title: 'Saved Note',
                message: value,
              });
            }
          }}
        >
          Open Prompt
        </button>
      );
    };

    render(
      <NotificationProvider>
        <Harness />
      </NotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Prompt' }));
    expect(screen.getByRole('dialog', { name: 'Add Note' })).toBeInTheDocument();

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New note' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved Note')).toBeInTheDocument();
    expect(await screen.findByText('New note')).toBeInTheDocument();
  });
});
