import { describe, expect, it, vi } from 'vitest';
import { confirm, notify, prompt, setConfirmRef, setNotifyRef, setPromptRef } from './notifyService';

describe('notifyService', () => {
  it('returns null when notifyRef is not set', () => {
    setNotifyRef(null);
    expect(
      notify({
        severity: 'info',
        title: 'Title',
        message: 'Message',
      })
    ).toBeNull();
  });

  it('forwards notifications to notifyRef', () => {
    const fn = vi.fn().mockReturnValue('id-123');
    setNotifyRef(fn);

    const result = notify({
      severity: 'success',
      title: 'Done',
      message: 'Saved',
    });

    expect(result).toBe('id-123');
    expect(fn).toHaveBeenCalledWith({
      severity: 'success',
      title: 'Done',
      message: 'Saved',
    });

    setNotifyRef(null);
  });

  it('confirm returns false when confirmRef is not set', async () => {
    setConfirmRef(null);
    await expect(
      confirm({
        title: 'Confirm',
        message: 'Proceed?',
      })
    ).resolves.toBe(false);
  });

  it('prompt returns null when promptRef is not set', async () => {
    setPromptRef(null);
    await expect(
      prompt({
        title: 'Prompt',
        message: 'Enter value',
      })
    ).resolves.toBeNull();
  });

  it('forwards confirm and prompt to their refs', async () => {
    const confirmFn = vi.fn().mockResolvedValue(true);
    const promptFn = vi.fn().mockResolvedValue('ok');

    setConfirmRef(confirmFn);
    setPromptRef(promptFn);

    await expect(
      confirm({
        title: 'Delete',
        message: 'Are you sure?',
        confirmText: 'Yes',
        cancelText: 'No',
      })
    ).resolves.toBe(true);

    await expect(
      prompt({
        title: 'Note',
        message: 'Add note',
        defaultValue: 'x',
        placeholder: 'Type...',
        confirmText: 'Save',
        cancelText: 'Cancel',
      })
    ).resolves.toBe('ok');

    expect(confirmFn).toHaveBeenCalledWith({
      title: 'Delete',
      message: 'Are you sure?',
      confirmText: 'Yes',
      cancelText: 'No',
    });

    expect(promptFn).toHaveBeenCalledWith({
      title: 'Note',
      message: 'Add note',
      defaultValue: 'x',
      placeholder: 'Type...',
      confirmText: 'Save',
      cancelText: 'Cancel',
    });

    setConfirmRef(null);
    setPromptRef(null);
  });
});
