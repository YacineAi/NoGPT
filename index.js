const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Botly = require("botly");
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SB_URL, process.env.SB_KEY, { auth: { persistSession: false} });
const port = process.env.PORT || 3000;
const botly = new Botly({
	accessToken: process.env.PAGE_ACCESS_TOKEN,
	notificationType: Botly.CONST.REGULAR,
	FB_URL: "https://graph.facebook.com/v2.6/",
});
app.get("/", function(_req, res) {
	res.sendStatus(200);
});
/* ----- ESSENTIALS ----- */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const headers = {
    'Accept': 'text/event-stream',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Content-type': 'application/json',
    'Host': 'shuttleproxy.com:6999',
    'Origin': 'http://shuttleproxy.com:6999',
    'Referer': 'http://shuttleproxy.com:6999/chat/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  };
/* ----- MAGIC ----- */
app.post('/webhook', (req, res) => {
 // console.log(req.body)
  if (req.body.message) {
    onMessage(req.body.message.sender.id, req.body.message);
  } else if (req.body.postback) {
    onPostBack(req.body.postback.message.sender.id, req.body.postback.message, req.body.postback.postback);
  }
  res.sendStatus(200);
});
/* ----- DB Qrs ----- */
async function createUser(user) {
    const { data, error } = await supabase
        .from('users')
        .insert([ user ]);
  
      if (error) {
        throw new Error('Error creating user : ', error);
      } else {
        return data
      }
  };
  
  async function updateUser(id, update) {
    const { data, error } = await supabase
      .from('users')
      .update( update )
      .eq('uid', id);
  
      if (error) {
        throw new Error('Error updating user : ', error);
      } else {
        return data
      }
  };
  
  async function userDb(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', userId);
  
    if (error) {
      console.error('Error checking user:', error);
    } else {
      return data
    }
  };
/* ----- HANDELS ----- */

const onMessage = async (senderId, message) => {
    const user = await userDb(senderId);
    const timer = new Date().getTime() + 1 * 60 * 60 * 1000;
    /* ---- */
    if (message.message.text) {
      if (user[0]) {
        if (Date.now() > user[0].time) {
          var reset = [];
          const data = {
            action: "_ask",
            model: "gpt-3.5-turbo",
            jailbreak: "default",
            meta: {
              id: "",
              content: {
                conversation: reset,
                internet_access: false,
                content_type: "text",
                parts: [{ content: message.message.text, role: "user" }]
              }
            }
          };
          const response = await axios.post('http://shuttleproxy.com:6999/backend-api/v2/conversation', data, { headers });
          reset.push({ "role": "user", "content": message.message.text }, { "role": "assistant", "content": response.data });
          await updateUser(senderId, {time: timer, data: reset })
          .then((data, error) => {
            if (error) {
                botly.sendText({id: senderId, text: "حدث خطأ"});
            }
            botly.sendText({id: senderId, text: response.data,
                quick_replies: [
                  botly.createQuickReply("👍", "up"),
                  botly.createQuickReply("👎", "down")]});
            });
        } else {
        var conv = user[0].data;
        const data = {
            action: "_ask",
            model: "gpt-3.5-turbo",
            jailbreak: "default",
            meta: {
              id: "",
              content: {
                conversation: conv,
                internet_access: false,
                content_type: "text",
                parts: [{ content: message.message.text, role: "user" }]
              }
            }
          };
          const response = await axios.post('http://shuttleproxy.com:6999/backend-api/v2/conversation', data, { headers });
          conv.push({ "role": "user", "content": message.message.text }, { "role": "assistant", "content": response.data });
          await updateUser(senderId, {time: timer, data: conv })
          .then((data, error) => {
            if (error) {
                botly.sendText({id: senderId, text: "حدث خطأ"});
            }
            botly.sendText({id: senderId, text: response.data,
                quick_replies: [
                  botly.createQuickReply("👍", "up"),
                  botly.createQuickReply("👎", "down")]});
            });
        }
      } else {
        await createUser({uid: senderId, time: timer, data: [] })
          .then((data, error) => {
            botly.send({
              "id": senderId,
              "message": {
              "text": "مستعمل جديد مرحبا",
              "quick_replies":[
                {
                  "content_type":"text",
                  "title":"كيفية الإستعمال 🤔",
                  "payload":"",
                }
              ]
            }
            });
          });
      }
      } else if (message.message.attachments[0].payload.sticker_id) {
        //botly.sendText({id: senderId, text: "(Y)"});
      } else if (message.message.attachments[0].type == "image") {
        botly.sendText({id: senderId, text: "NotAllowed"});
      } else if (message.message.attachments[0].type == "audio") {
        botly.sendText({id: senderId, text: "NotAllowed"});
      } else if (message.message.attachments[0].type == "video") {
        botly.sendText({id: senderId, text: "NotAllowed"});
      }
};
/* ----- POSTBACK ----- */

const onPostBack = async (senderId, message, postback) => {};
/* ----- HANDELS ----- */
app.listen(port, () => console.log(`App is on port : 3000`));