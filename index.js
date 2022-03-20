const fs = require('fs');
const { WebcastPushConnection } = require('tiktok-livestream-chat-connector');

// Username of someone who is currently live
let tiktokUsername = "fan_ou_house";
let giftInfo = [];
let secondsRunning = 0;
let coinsSent = 0;

// Create a new wrapper object and pass the username
let tiktokChatConnection = new WebcastPushConnection(tiktokUsername, { 
  enableExtendedGiftInfo: true,
  requestPollingIntervalMs: 1000,
});

fs.mkdirSync('output', { recursive: true });

// Connect to the chat (await can be used as well)
tiktokChatConnection.connect().then(state => {
    console.info(`Connected to roomId ${state.roomId}`);
})
.then(() => {
  return tiktokChatConnection.getAvailableGifts().then(gifts => {
    // console.info(`Available gifts: ${JSON.stringify(gifts)}`);
    fs.writeFileSync('output/gifts.json', JSON.stringify(gifts, null, 2));
    giftInfo = gifts;
  });
})
.catch(err => {
    console.error('Failed to connect', err);
})

// Define the events that you want to handle
// In this case we listen to chat messages (comments)
// tiktokChatConnection.on('chat', data => {
//     console.log(`${data.uniqueId} (userId:${data.userId}) writes: ${data.comment}`);
// })

// And here we receive gifts sent to the streamer
tiktokChatConnection.on('gift', data => {
  const minutesRunning = Math.round(secondsRunning / 60 * 100) / 100;
  const gift = giftInfo.find(gift => gift.id === data.giftId);
  if (gift) {
    coinsSent += gift.diamond_count;
    console.log(`${data.uniqueId} (userId:${data.userId}) sends ${gift.name} for ${gift.diamond_count} coins`);
    console.log(`Stream has been running for ${minutesRunning} minutes and has made ${coinsSent} coins`);
  }
  else {
    console.log(`${data.uniqueId} (userId:${data.userId}) sends ${data.giftId}`);
  }
})

// run a timer to follow how long we've been watching stream
const timerLoop = () => {
  secondsRunning++;
  setTimeout(timerLoop, 1000);
}
timerLoop();