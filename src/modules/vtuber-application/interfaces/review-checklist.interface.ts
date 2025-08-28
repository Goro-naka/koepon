export interface ReviewChecklistItem {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  required: boolean;
}

export interface ReviewChecklistConfig {
  [stage: string]: ReviewChecklistItem[];
}

export const DEFAULT_REVIEW_CHECKLIST: ReviewChecklistConfig = {
  initial_screening: [
    {
      id: 'profile_complete',
      label: 'Profile Information Complete',
      description: 'All required profile fields are filled',
      checked: false,
      required: true,
    },
    {
      id: 'valid_channel_url',
      label: 'Valid Channel URL',
      description: 'Channel URL is accessible and valid',
      checked: false,
      required: true,
    },
    {
      id: 'content_appropriate',
      label: 'Content is Appropriate',
      description: 'Content meets community guidelines',
      checked: false,
      required: true,
    },
  ],
  document_review: [
    {
      id: 'identity_verified',
      label: 'Identity Documents Verified',
      description: 'Identity documents are valid and verified',
      checked: false,
      required: true,
    },
    {
      id: 'activity_proof_valid',
      label: 'Activity Proof Valid',
      description: 'Proof of streaming activity is acceptable',
      checked: false,
      required: false,
    },
  ],
  content_evaluation: [
    {
      id: 'content_quality',
      label: 'Content Quality Assessment',
      description: 'Content quality meets standards',
      checked: false,
      required: true,
    },
    {
      id: 'audience_engagement',
      label: 'Audience Engagement',
      description: 'Shows good audience engagement',
      checked: false,
      required: false,
    },
  ],
  final_review: [
    {
      id: 'all_requirements_met',
      label: 'All Requirements Met',
      description: 'All previous review stages passed',
      checked: false,
      required: true,
    },
    {
      id: 'platform_fit',
      label: 'Platform Fit Assessment',
      description: 'Applicant is a good fit for the platform',
      checked: false,
      required: true,
    },
  ],
};