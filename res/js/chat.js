/**
 * @typedef {object} UserMessage
 * @prop {string} sender
 * @prop {string} content
 */

/**
 * @typedef {object} JoinLeaveMessage
 * @prop {string} username
 */

/////////////// element code

// remember: globalThis is window
onresize = () => {
	document.body.style.height = innerHeight + 'px';
};

/** @type {HTMLDivElement} */
const chatContainer = document.getElementById('chat-container');

/** @type {HTMLDivElement & { scrollToBottom: (_: ScrollBehavior) => void, scrollBottom: readonly number }} */
const messagesView = document.getElementById('messages-view');

/** @param {ScrollBehavior} [behavior] */
messagesView.scrollToBottom = function(behavior) {
	this.scrollTo({ top: this.scrollHeight - this.clientHeight, behavior });
};

Object.defineProperty(messagesView, 'scrollBottom', {
	/**
	 * distance from the bottom of [`clientHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight)
	 * to the bottom of [`scrollHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight)
	 */
	get: function() { return this.scrollHeight - this.scrollTop - this.clientHeight; }
});

const newMessageIndicator = document.getElementById('nm-indicator');

/** @type {HTMLDialogElement} */
const startDialog = document.getElementById('start-form');

/** @type {HTMLInputElement} */
const usernameInput = document.getElementById('username-input');

/** @type {HTMLInputElement} */
const chatroomInput = document.getElementById('chatroom-input');

/** @type {HTMLInputElement} */
const messageInput = document.getElementById('message-input');

/** @type {HTMLDivElement} */
const errorLabel = document.getElementById('error-label');

/** @type {HTMLDivElement} */
const usernameLabel = document.getElementById('username-label');

/** @type {HTMLButtonElement} */
const leaveChatButton = document.getElementById('leave-chat-button');

/** @type {HTMLDivElement} */
const typingLabel = document.getElementById('typing-label');

/** @type {HTMLDivElement} */
const typingUsernames = document.getElementById('typing-usernames');

const hideInteractiveElements = () => {
	messageInput.hidden = true;
	leaveChatButton.hidden = true;
};

/**
 * @param {'user' | 'join' | 'leave'} type
 * @param {string} innerHTML
 */
const appendMessage = (type, innerHTML) => {
	const lastMessage = messagesView.lastElementChild;
	const oldScrollBottom = messagesView.scrollBottom;

	const newMessage = createElement('div', { className: `tt-border ${type}-msg`, innerHTML });
	messagesView.append(newMessage);

	if (messagesView.scrollHeight === messagesView.clientHeight)
		// return here if messagesView is not yet scrollable
		return;
	
	// if, before appending the new message, the most recent message was partially visible
	if (oldScrollBottom < lastMessage?.clientHeight)
		// force the scroll to the bottom
		newMessage.scrollIntoView();
	else
		// show the new message indicator
		newMessageIndicator.style.visibility = 'visible';
};

messagesView.onscrollend = () => {
	// if the distance from the bottom of the scroll view to the bottom of messagesView is less than 10 pixels
	if (messagesView.scrollBottom < 10)
		// hide the new message indicator
		newMessageIndicator.style.visibility = 'hidden';
};

/** @param {UserMessage} */
const appendUserMessage = ({ sender, content }) => appendMessage('user', `<b>${sender}</b><div>${content}</div>`);

/** @param {JoinLeaveMessage} */
const appendJoinMessage = ({ username }) => appendMessage('join', `<b>${username}</b> has joined the chat`);

/** @param {JoinLeaveMessage} */
const appendLeaveMessage = ({ username }) => appendMessage('leave', `<b>${username}</b> has left the chat`);

const showTypingLabel = () => typingLabel.style.opacity = 1;
const hideTypingLabel = () => typingLabel.style.opacity = 0;

/////////////// websocket code

const // object types for the JSON objects going through the WebSocket
	USER_JOIN = 0,
	USER_MESSAGE = 1,
	USER_LEAVE = 2,
	ERR_USERNAME_TAKEN = 3,
	USER_TYPING = 4,
	USER_STOPPED_TYPING = 5;

/** @type {string} */
let username;

/** @type {number} */
let stopTypingTimeout;

const ws = new WebSocket('wss://chat.trustytrojan.dev');

ws.onopen = startDialog.showModal.bind(startDialog);

ws.onmessage = ({ data }) => {
	/** @type {UserMessage | JoinLeaveMessage} */
	const obj = JSON.parse(data.toString());

	switch (obj.type) {
		case USER_JOIN:
			if (obj.username === username) {
				startDialog.close();
				usernameLabel.hidden = false;
				usernameLabel.innerHTML = `Your username: <b>${username}</b>`;
			}
			appendJoinMessage(obj);
			break;

		case USER_MESSAGE:
			appendUserMessage(obj);
			// if this user sent this message
			if (obj.sender === username)
				// move it into view no matter where their scroll is
				messagesView.lastElementChild?.scrollIntoView();
			break;

		case USER_LEAVE:
			appendLeaveMessage(obj);
			if (obj.username === username) {
				ws.close(1000, 'left the chat');
				hideInteractiveElements();
				usernameLabel.hidden = true;
				document.body.appendChild(createElement('b', { innerHTML: 'You have left the chat.' }));
			}
			break;

		case USER_TYPING:
			if (obj.username === username) break;
			showTypingLabel();
			typingUsernames.appendChild(createElement('b', {
				id: `typing-${obj.username}`,
				innerHTML: obj.username,
				className: 'typing-username'
			}));
			break;

		case USER_STOPPED_TYPING:
			const typingUsernameLabel = document.getElementById(`typing-${obj.username}`);
			if (typingUsernameLabel)
				typingUsernames.removeChild(typingUsernameLabel);
			if (typingUsernames.children.length == 0)
				hideTypingLabel();
			break;

		case ERR_USERNAME_TAKEN:
			errorLabel.textContent = 'Error: username already taken!';
			break;
	}
};

ws.onerror = (ev) => { if (ev.type === 'error') errorLabel.textContent = 'Error connecting to chat server!'; };

ws.onclose = () => {
	hideInteractiveElements();
	document.body.appendChild(createElement('b', { innerHTML: 'You were disconnected from the server.' }));
};

/**
 * @param {number} type 
 * @param {object} obj 
 */
const sendChatData = (type, obj = {}) => ws.send(JSON.stringify({ type, ...obj }));

const stopTyping = () => {
	sendStoppedTyping();
	stopTypingTimeout = null;
};

messageInput.onkeydown = ({ key }) => {
	if (key !== 'Enter') return;
	clearTimeout(stopTypingTimeout);
	sendMessage();
	stopTyping();
};

crypto.randomUUID();

messageInput.oninput = ({ target: { value } }) => {
	if (!value) // input is empty
		stopTyping();
	else {
		if (stopTypingTimeout)
			clearTimeout(stopTypingTimeout);
		else
			sendTyping();
		stopTypingTimeout = setTimeout(stopTyping, 1_500);
	}
};

const joinChat = () => {
	username = usernameInput.value;
	chatroom = chatroomInput.value;
	if (!username.trim()) { errorLabel.textContent = 'Error: username cannot be empty!'; return; }
	if (!chatroom.trim()) chatroom = 'public';
	sendChatData(USER_JOIN, { username });
};

const sendMessage = () => {
	const content = messageInput.value;
	messageInput.value = '';
	if (!content.trim()) return;
	sendChatData(USER_MESSAGE, { content });
};

const sendTyping = () => sendChatData(USER_TYPING);
const sendStoppedTyping = () => sendChatData(USER_STOPPED_TYPING);
const leaveChat = () => sendChatData(USER_LEAVE);
