const isDev = import.meta.env.MODE === 'development';
const doMain = isDev ? 'jicheng.msunhis.com' : window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
const selectSystem = JSON.parse(sessionStorage.getItem('selectedSystem'));
const protocol = window.location.protocol.indexOf('https') !== -1 ? 'wss://' : 'wss://';
let url = `${protocol}${doMain}/msun-websocket-server/ws-server?clientId=${currentUser.hospitalId}${selectSystem.deptId}&appName=msun-pacs-app-pacs&busiName=ocrIdentifyResult&token=${currentUser.token}&storage=true&host=${doMain}`;

let Socket = null;
let setIntervalWebsocketPush = null;
let handleOnMessage = function () {};

/**
 * 建立websocket连接
 */
export const createSocketForOcr = () => {
  // Socket && Socket.close();
  if (!Socket) {
    Socket = new WebSocket(url);
    Socket.onopen = onopenWS;
    Socket.onmessage = onmessageWS;
    Socket.onerror = onerrorWS;
    Socket.onclose = oncloseWS;
  } else {
    // console.log('websocket已连接');
  }
};

/** 打开WS之后发送心跳 */
const onopenWS = () => {
  sendPing();
};

/** 连接失败重连 */
const onerrorWS = () => {
  console.warn('图像识别 onerrorWS');
  Socket && Socket.close();
  clearInterval(setIntervalWebsocketPush);
  
  if (Socket && Socket.readyState !== 3) {
    Socket = null;
    createSocketForOcr();
  }
};

/** WS数据接收统一处理 */
const onmessageWS = (e) => {
  if (e.data !== 'PONG') {
    const responseData = JSON.parse(e.data);
    if (responseData?.content) {
      const content = JSON.parse(responseData.content);
      handleOnMessage(content + '');
    }
  }
};

/**
 * 发送数据但连接未建立时进行处理等待重发
 * @param {any} message 需要发送的数据
 */
const connecting = (message) => {
  setTimeout(() => {
    if (Socket && Socket.readyState === 0) {
      connecting(message);
    } else {
      Socket && Socket.send(JSON.stringify(message));
    }
  }, 1000);
};

/**
 * 发送数据
 * @param {any} message 需要发送的数据
 */
export const sendWSPush = (message) => {
  if (Socket !== null && Socket.readyState === 3) {
    Socket && Socket.close();
    createSocketForOcr();
  } else if (Socket && Socket.readyState === 1) {
    Socket && Socket.send(JSON.stringify(message));
  } else if (Socket && Socket.readyState === 0) {
    connecting(message);
  }
};

export const destroyOcrWebsocket = () => {
  try {
    clearInterval(setIntervalWebsocketPush);
    Socket.close(1000, '用户手动断开连接');
    Socket = null;
  } catch (error) {}
};

/** 断开重连 */
const oncloseWS = event => {
  if (event.code === 1000) {
    clearInterval(setIntervalWebsocketPush);
    Socket = null;
    return false;
  }
  clearInterval(setIntervalWebsocketPush);
  console.warn('图像识别websocket已断开....正在尝试重连', event);
  if (Socket && Socket.readyState !== 2) {
    Socket = null;
    setTimeout(createSocketForOcr, 3000);
  }
};
/** 发送心跳
 * @param {number} time 心跳间隔毫秒 默认5000
 * @param {string} ping 心跳名称 默认字符串ping
 */
export const sendPing = (time = 5000, ping = 'ping') => {
  clearInterval(setIntervalWebsocketPush);
  Socket && Socket.send(ping);
  setIntervalWebsocketPush = setInterval(() => {
    Socket && Socket.send(ping);
  }, time);
};
/**
 * 注册onmessage响应事件
 * @param fn
 */
export const ocrSoketOnMessage = (fn) => {
  handleOnMessage = fn;
};
