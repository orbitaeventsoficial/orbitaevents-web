import postEventWorkflowConfig from './postEventWorkflow.json';

export const POST_EVENT_DAY_MS = 1000 * 60 * 60 * 24;

export const POST_EVENT_WORKFLOW = {
  emailDueDays: postEventWorkflowConfig.emailDueDays,
  startDueDays: postEventWorkflowConfig.startDueDays,
  catchupWindowDays: postEventWorkflowConfig.catchupWindowDays,
  pendingTake: postEventWorkflowConfig.pendingTake,
  automationTake: postEventWorkflowConfig.automationTake,
  playbookTake: postEventWorkflowConfig.playbookTake,
  actionDueDays: {
    thank_you: postEventWorkflowConfig.actionDueDays.thank_you,
    testimonial: postEventWorkflowConfig.actionDueDays.testimonial,
    social_post: postEventWorkflowConfig.actionDueDays.social_post,
    referral_ask: postEventWorkflowConfig.actionDueDays.referral_ask,
  },
} as const;

export function getPostEventWorkflowDates(now: Date = new Date()) {
  return {
    catchupFrom: new Date(now.getTime() - POST_EVENT_WORKFLOW.catchupWindowDays * POST_EVENT_DAY_MS),
    emailDueBefore: new Date(now.getTime() - POST_EVENT_WORKFLOW.emailDueDays * POST_EVENT_DAY_MS),
    startDueBefore: new Date(now.getTime() - POST_EVENT_WORKFLOW.startDueDays * POST_EVENT_DAY_MS),
  };
}
