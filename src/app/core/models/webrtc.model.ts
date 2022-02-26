export type StreamAction =
  | 'onMute'
  | 'onMuteVideo'
  | 'onConnect'
  | 'onDisconnect'
  | 'onTrack'
  | 'onError';

export type TrackPosition = 'mainPosition' | 'mainThumbPosition' | 'sideThumbPosition';

export type DisplayName = 'studentWebcam' | 'teacherWebcam' | 'teacherScreen';

export type DeviceType = 'audioinput' | 'audiooutput' | 'videoinput';

export type PublishType = 'Webcam' | 'Screen';

export interface PeerConnectionOptions {
  // subscription mode
  publishId?: any;
  userId: any;
  getRemoteOfferSdp?: () => Promise<any>;
  startSubscription?: (spd: string) => Promise<any>;
  onTrack?: (event?: RTCTrackEvent) => any;

  // publish mode
  publishType?: PublishType;
  display?: DisplayName;
  stream?: MediaStream;
  getRemoteAnswerSdp?: (offerSdp: string) => Promise<any>;
  publishConfirm?: () => any;

  // common
  position?: TrackPosition;
  onConnect?: () => any;
  onDisconnect?: () => any;
  onError?: (error: string) => any;
}

export interface RoomUser {
  id: number;
  active: boolean;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: string;
  state: string;
  username: string;
  raise_hand: boolean;
  muted: boolean;
  muted_video: boolean;
  has_mic: boolean;
  has_cam: boolean;
  device: string;
  avatar: string;
}

export interface Publisher {
  id: number;
  display?: DisplayName;
  talking?: boolean;
  user_id: any;
  publish_type?: PublishType;
}

export interface StreamActionEvent {
  action: StreamAction;
  userId: any;
  stream?: MediaStream;
  position?: TrackPosition;
  display?: DisplayName;
  publishType?: PublishType;
}

export enum SocketEventTypes {
  ACK = 'ACK',
  MutePerson = 'mutePerson',
  MuteVideo = 'muteVideo',
  MuteVideoAll = 'muteVideoAll',
  LeaveRoom = 'leaveRoom',
  KickUser = 'kickUser',
  CloseRoom = 'closeRoom',
  RaiseHand = 'raiseHand',
  MuteAll = 'muteAll',
  NewPublisher = 'newPublisher',
  UserDisconnected = 'userDisconnected',
  Unpublish = 'unpublish',
  NewUser = 'newUser',
  AssignAdmin = 'assignAdmin',
  Connect = 'connect',
  IsTalking = 'isTalking',
  PublicChatState = 'publicChatState',
  NewMessage = 'newMessage',
  DeletedMessage = 'deletedMessage',
  NewQuestion = 'newQuestion',
  FinishedQuestion = 'finishedQuestion',
  CanceledQuestion = 'canceledQuestion',
  NewQuestionReply = 'newQuestionReply',
  NewPoll = 'newPoll',
  FinishedPoll = 'finishedPoll',
  CanceledPoll = 'canceledPoll',
  NewPollReply = 'newPollReply',
  ChangePresentationPage = 'changePresentationPage',
  OpenPresentation = 'openPresentation',
  ClosePresentation = 'closePresentation',
}

