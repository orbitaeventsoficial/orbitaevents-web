import { buildCustomerHubHref, buildCustomerWorkspaceTabHref } from '@/lib/admin/customerWorkspaceHref';

export type TaskRedirectResult = 'created' | 'deduped' | 'reopened';

export function getCustomerHubTaskNotice(taskSource: string | null | undefined, taskResult: string | null | undefined): string | null {
  if (taskSource !== 'reactivation') return null;

  if (taskResult === 'created') {
    return 'Tasca de reactivació creada.';
  }
  if (taskResult === 'deduped') {
    return 'Ja existia una tasca de reactivació oberta; s’ha reutilitzat.';
  }
  if (taskResult === 'reopened') {
    return 'La tasca de reactivació existent s’ha reobert amb el nou context.';
  }

  return null;
}

export function buildCustomerHubTaskHref(
  customerId: string,
  taskSource: string | null | undefined,
  taskResult: TaskRedirectResult
): string {
  const params = new URLSearchParams({ tab: 'tasks' });

  if (taskSource) {
    params.set('taskSource', taskSource);
    params.set('taskResult', taskResult);
  }

  return taskSource
    ? `${buildCustomerHubHref(customerId)}?${params.toString()}`
    : buildCustomerWorkspaceTabHref(customerId, 'tasks');
}
