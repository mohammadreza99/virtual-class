export const requests = [
  {method: 'getSelf', loading: true, success: false, failure: true},
  {method: 'createCompany', loading: true, success: false, failure: true},
  {method: 'login', loading: true, success: false, failure: true},
  {method: 'forgetPassword', loading: true, success: false, failure: true},
  {method: 'setPassword', loading: true, success: true, failure: true},
  {method: 'updatePassword', loading: true, success: true, failure: true},
  {method: 'updateProfile', loading: true, success: true, failure: true},
  {method: 'uploadAvatar', loading: true, success: true, failure: true},
  {method: 'deleteAvatar', loading: true, success: true, failure: true},
  {method: 'searchGroup', loading: true, success: false, failure: true},
  {method: 'addGroup', loading: true, success: true, failure: true},
  {method: 'updateGroup', loading: true, success: true, failure: true},
  {method: 'deleteGroup', loading: true, success: true, failure: true},
  {method: 'activateGroup', loading: true, success: true, failure: true},
  {method: 'getGroupUsers', loading: true, success: false, failure: true},
  {method: 'addUsersToGroup', loading: true, success: true, failure: true},
  {method: 'deleteUsersFromGroup', loading: true, success: true, failure: true},
  {method: 'getGroupRelations', loading: true, success: false, failure: true},
  {method: 'getGroup', loading: true, success: false, failure: true},
  {method: 'assignAdminGroup', loading: true, success: true, failure: true},
  {method: 'listMyRooms', loading: true, success: false, failure: true},
  {method: 'getRoom', loading: true, success: false, failure: true},
  {method: 'createRoom', loading: true, success: true, failure: true},
  {method: 'updateRoom', loading: true, success: true, failure: true},
  {method: 'deleteRoom', loading: true, success: true, failure: true},
  {method: 'activateRoom', loading: true, success: true, failure: true},
  {method: 'getRoomUsers', loading: true, success: false, failure: true},
  {method: 'getRoomGroups', loading: true, success: false, failure: true},
  {method: 'addUserOrGroupToRoom', loading: true, success: true, failure: true},
  {method: 'deleteGroupFromRoom', loading: true, success: true, failure: true},
  {method: 'deleteUserFromRoom', loading: true, success: true, failure: true},
  {method: 'generateRoomLink', loading: true, success: true, failure: true},
  {method: 'assignAdmin', loading: true, success: true, failure: true},
  {method: 'mutePerson', loading: false, success: false, failure: true},
  {method: 'muteAll', loading: false, success: false, failure: true},
  {method: 'muteVideo', loading: false, success: false, failure: true},
  {method: 'muteVideoAll', loading: false, success: false, failure: true},
  {method: 'leaveRoom', loading: true, success: false, failure: true},
  {method: 'closeRoom', loading: true, success: false, failure: true},
  {method: 'kickUser', loading: true, success: false, failure: true},
  {method: 'raiseHand', loading: false, success: false, failure: true},
  {method: 'getRoomActiveUsers', loading: false, success: false, failure: true},
  {method: 'unpublish', loading: false, success: false, failure: true},
  {method: 'userEnterStatus', loading: true, success: false, failure: true},
  {method: 'newSession', loading: false, success: false, failure: true},
  {method: 'restoreKickedUser', loading: false, success: true, failure: true},
  {method: 'getRoomInfo', loading: true, success: false, failure: true},
  {method: 'newPublisher', loading: false, success: false, failure: true},
  {method: 'sendPublicMessage', loading: false, success: false, failure: true},
  {method: 'changePublicChatState', loading: false, success: true, failure: true},
  {method: 'changePrivateChatState', loading: false, success: true, failure: true},
  {method: 'deletePublicMessage', loading: true, success: true, failure: true},
  {method: 'isTalking', loading: false, success: false, failure: true},
  {method: 'addQuestion', loading: false, success: true, failure: true},
  {method: 'getQuestion', loading: false, success: false, failure: true},
  {method: 'getQuestionSelfReplies', loading: false, success: false, failure: true},
  {method: 'getArchivedQuestions', loading: false, success: false, failure: true},
  {method: 'getQuestionResult', loading: false, success: false, failure: true},
  {method: 'changeQuestionPublishState', loading: true, success: true, failure: true},
  {method: 'replyQuestion', loading: true, success: false, failure: true},
  {method: 'addPoll', loading: false, success: true, failure: true},
  {method: 'getPoll', loading: false, success: false, failure: true},
  {method: 'getArchivedPolls', loading: false, success: false, failure: true},
  {method: 'getPollResult', loading: false, success: false, failure: true},
  {method: 'changePollPublishState', loading: false, success: true, failure: true},
  {method: 'submitPoll', loading: true, success: true, failure: true},
  {method: 'exportSessionAttendance', loading: true, success: false, failure: true},
  {method: 'getPresentationUploadForm', loading: false, success: false, failure: true},
  {method: 'changePresentationPage', loading: false, success: false, failure: true},
  {method: 'changePresentationState', loading: false, success: false, failure: true},
  {method: 'deletePresentation', loading: false, success: false, failure: true},
  {method: 'getActivePresentations', loading: false, success: false, failure: true},
  {method: 'presentationUploadCompleted', loading: false, success: true, failure: true},
  {method: 'uploadUserAvatar', loading: true, success: true, failure: true},
  {method: 'deleteUserAvatar', loading: true, success: true, failure: true},
  {method: 'selectRandomUser', loading: false, success: true, failure: true},
  {method: 'getPublicMessages', loading: true, success: false, failure: true},
  {method: 'roomStatus', loading: false, success: false, failure: true},
  {method: 'joinSubscriber', loading: false, success: false, failure: true},
  {method: 'startSubscription', loading: false, success: false, failure: true},
  {method: 'joinPublisher', loading: false, success: false, failure: true},
  {method: 'searchUser', loading: true, success: false, failure: true},
  {method: 'addUser', loading: true, success: true, failure: true},
  {method: 'updateUser', loading: true, success: true, failure: true},
  {method: 'deleteUser', loading: true, success: true, failure: true},
  {method: 'activateUser', loading: true, success: true, failure: true},
  {method: 'resetPassword', loading: true, success: true, failure: true},
  {method: 'getUserRelations', loading: true, success: false, failure: true},
  {method: 'updateBoard', loading: false, success: false, failure: true},
  {method: 'openBoard', loading: false, success: true, failure: true},
  {method: 'closeBoard', loading: false, success: true, failure: true},
  {method: 'changeBoardSlide', loading: false, success: false, failure: true},
  {method: 'getBoard', loading: true, success: false, failure: true},
  {method: 'setBoardPermission', loading: false, success: true, failure: true},
  {method: 'removeBoardPermission', loading: false, success: true, failure: true},
  {method: 'videoAction', loading: false, success: false, failure: true},
  {method: 'presentLink', loading: false, success: true, failure: true},
  {method: 'sendPVMessage', loading: false, success: false, failure: true},
  {method: 'getPVList', loading: false, success: false, failure: true},
  {method: 'getPVMessage', loading: false, success: false, failure: true},
  {method: 'boardPermission', loading: false, success: false, failure: true},
  {method: 'pinPublicMessage', loading: false, success: true, failure: true},
  {method: 'useHere', loading: false, success: false, failure: true},
  {method: 'unpinPublicMessage', loading: false, success: false, failure: true},
  {method: 'saveChat', loading: false, success: true, failure: true},
  {method: 'openPV', loading: false, success: false, failure: true},
];
