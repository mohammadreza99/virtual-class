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
  onClose?: () => any;
  onFailed?: (reason?: string) => any;
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
  kicked: boolean;
  device: string;
  avatar: string;
  user_message_state: boolean;
}

export interface Publisher {
  id: number;
  display?: DisplayName;
  talking?: boolean;
  user_id: any;
  publish_type?: PublishType;
}

export type RoomEventType =
  'ACK' |
  'mutePerson' |
  'muteVideo' |
  'muteVideoAll' |
  'leaveRoom' |
  'kickUser' |
  'closeRoom' |
  'raiseHand' |
  'muteAll' |
  'newPublisher' |
  'userDisconnected' |
  'unpublish' |
  'newUser' |
  'assignAdmin' |
  'connect' |
  'isTalking' |
  'publicChatState' |
  'newMessage' |
  'deletedMessage' |
  'newQuestion' |
  'finishedQuestion' |
  'canceledQuestion' |
  'newQuestionReply' |
  'newPoll' |
  'finishedPoll' |
  'canceledPoll' |
  'newPollReply' |
  'changePresentationPage' |
  'openPresentation' |
  'closePresentation' |
  'deletePresentation' |
  'randomUser' |
  'restoreUser' |
  'newMedia' |
  'updateBoard' |
  'openBoard' |
  'closeBoard' |
  'changeBoardSlide' |
  'setBoardPermission' |
  'removeBoardPermission' |
  'userContainersChange' |
  'roomParticipantsChange' |
  'raiseHandsChange' |
  'kickedUsersChange' |
  'onTrack' |
  'onDisconnect' |
  'studentRaisedHand' |
  'teacherConfirmRaisedHand' |
  'remoteAnswer' |
  'networkIssue' |
  'updateAvatar' |
  'startBoard' |
  'newPVMessage' |
  'videoAction' |
  'publicMessagesChange' |
  'pinnedMessage' |
  'clearPublicMessages' |
  'messageMutedUser' |
  'gotNewPrivateMessage' |
  'gotNewPublicMessage' |
  'sessionExist' |
  'privateMessagesChange';

