const fs = require('fs');
const { WebcastPushConnection } = require('tiktok-livestream-chat-connector');
const WebSocketServer = require('ws');

// Username of someone who is currently live
let tiktokUsername = "frog_smile21";
let connected = false;
let giftInfo = [];

let controlMap = {
  "Tennis": {
    fn: (user) => { input(user, 'up'); },
  },
  "Football": {
    fn: (user) => { input(user, 'down'); },
  },
  "GG": {
    fn: (user) => { input(user, 'left'); },
  },
  "Mini Speaker": {
    fn: (user) => { input(user, 'right') },
  },
  "Ice Cream Cone": {
    fn: (user) => { input(user, 'a') },
  },
  "Weights": {
    fn: (user) => { input(user, 'b') },
  },
  "Rose": {
    fn: (user) => { input(user, 'start') },
  },
}

fs.mkdirSync('output', { recursive: true });


const connect = async () => {
  // Connect to the chat (await can be used as well)
  try {
    // Create a new wrapper object and pass the username
    let tiktokChatConnection = new WebcastPushConnection(tiktokUsername, {
      enableExtendedGiftInfo: true,
      requestPollingIntervalMs: 1000,
    });

    return tiktokChatConnection.connect()
      .then(state => {
        console.info(`Connected to roomId ${state.roomId}`);
        connected = true;
      })
      .then(() => {
        return tiktokChatConnection.getAvailableGifts().then(gifts => {
          console.log('got gift info');
          fs.writeFileSync('output/gifts.json', JSON.stringify(gifts, null, 2));
          giftInfo = gifts;
          return tiktokChatConnection;
        });
      })
      .catch(err => {
        console.error('Failed to connect: ', err.message);
        connected = false;
        // retry connection after 5 seconds
        return new Promise(resolve => setTimeout(resolve, 5000)).then(connect);
      })
  }
  catch (err) {
  }
}

// setup the websocket server
const wss = new WebSocketServer.Server({ port: 8123 });

const input = (user, controlInput) => {
  console.log(`${user.uniqueId} pressed ${controlInput}`);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify({
        user: user.uniqueId,
        controlInput,
      }));
    }
  }
};

connect().then((connection) => {
  connection.on('gift', data => {
    const gift = giftInfo.find(gift => gift.id === data.giftId);
    if (!gift) {
      // TODO: do something if it's an invalid gift or gift info isn't loaded
      console.log('Gift not in config', data.giftId);
      return;
    }
    const control = controlMap[gift.name];
    if (!control) {
      // TODO: handle this
      // console.log('No input associated with gift', gift.name);
      return;
    }
    control.fn(data);
  });
});