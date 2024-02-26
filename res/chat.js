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

/** @type {HTMLDivElement} */
const chatContainer = document.getElementById('chat-container');

/** @type {HTMLDivElement} */
const messagesView = document.getElementById('messages-view');

/** @type {HTMLDialogElement} */
const startDialog = document.getElementById('start-form');

/** @type {HTMLInputElement} */
const usernameInput = document.getElementById('username-input');

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

usernameInput.placeholder = 'test build 5';

/**
 * @param {'user' | 'join' | 'leave'} type
 * @param {string} innerHTML
 */
const appendMessage = (type, innerHTML) => {
	const lastMessage = messagesView.lastElementChild;

	/**
	 * distance from the bottom of [`clientHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight)
	 * to the bottom of [`scrollHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight)
	 */
	const scrollBottom = messagesView.scrollHeight - messagesView.scrollTop - messagesView.clientHeight;

	const messageElement = createElement('div', { className: `tt-border ${type}-msg`, innerHTML });
	messagesView.append(messageElement);
	
	// if the most recent message is visible
	if (scrollBottom < lastMessage?.clientHeight)
		// force the scroll to the bottom
		messageElement.scrollIntoView();
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

messageInput.oninput = ({ target: { value } }) => {
	if (value === '') {
		stopTyping();
	} else {
		if (stopTypingTimeout)
			clearTimeout(stopTypingTimeout);
		else
			sendTyping();
		stopTypingTimeout = setTimeout(stopTyping, 1_500);
	}
};

const joinChat = () => {
	username = usernameInput.value;
	if (!username.trim()) { errorLabel.textContent = 'Error: username cannot be empty!'; return; }
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
