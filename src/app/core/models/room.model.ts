export type ViewMode = 'speaker' | 'grid' | 'thumbnail';
export type QuestionState = 'Draft' | 'InProgress' | 'Canceled' | 'Finished';

export interface Room {
  id: number;
  name: string;
  max_user: number;
  admin_user_id: number;
  start_datetime: string;
  end_datetime: string;
  active: boolean;
  private: boolean;
  status?: string;
  online_users?: number;
  session_duration?: number;
  public_messages?: boolean;
  active_question?: number;
  active_poll?: number;
  presentation?: any;
}

export interface UserOrGroup {
  type: 'User' | 'Group';
  model_id: number;
  role: 'Admin' | 'Viewer';
}

export interface QuestionOption {
  question_no?: number;
  description: string;
  correct_answer: boolean;
}

export interface PollOption {
  id: number;
  description: string;
}

export interface QuestionItem {
  id: number;
  state: QuestionState;
  description: string;
  options: any[];
}

export interface PollItem {
  id: number;
  state: QuestionState;
  description: string;
  multiple_choice: boolean;
  options: any[];
}
