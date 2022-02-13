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
  description: string;
}

export type ViewMode = 'speaker' | 'grid' | 'thumbnail';
