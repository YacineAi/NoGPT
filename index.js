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
    accept: '*/*',
    'accept-language': 'en,ar-DZ;q=0.9,ar;q=0.8',
    authorization: 'Bearer undefined',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    Referer: `https://${process.env.REF}/`,
    'Referrer-Policy': 'strict-origin-when-cross-origin'
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
    if (message.message.text) { // message.message.text
      botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.MARK_SEEN}, async () => {
        if (user[0]) {
          if (Date.now() > user[0].time) {
            var reset = [];
            const data = {
              "model": "gpt-3.5-turbo",
              "messages": [
                { "role": "user", "content": message.message.text }
              ]
            };
            botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON}, async () => {
              const response = await axios.post(`https://${process.env.SHHHH}/v1/chat/completions`, data, { headers });
              reset.push({ "role": "user", "content": message.message.text }, { "role": "assistant", "content": response.data.choices[0].message.content });
              await updateUser(senderId, {time: timer, data: reset })
              .then((data, error) => {
                if (error) {
                    botly.sendText({id: senderId, text: "حدث خطأ"});
                }
                botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_OFF}, async () => {
                  botly.sendText({id: senderId, text: response.data.choices[0].message.content,
                    quick_replies: [
                      botly.createQuickReply("👍", "up"),
                      botly.createQuickReply("👎", "down")]});
                });
                });
              });
          } else {
          var conv = user[0].data;
          conv.push({ "role": "user", "content": message.message.text })
          const data = {
            "model": "gpt-3.5-turbo",
            "messages": conv
          };
            botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON}, async () => {
              try {
              const response = await axios.post(`https://${process.env.SHHHH}/v1/chat/completions`, data, { headers });
              conv.push({ "role": "assistant", "content": response.data.choices[0].message.content });
              await updateUser(senderId, {time: timer, data: conv })
              .then((data, error) => {
                if (error) {
                    botly.sendText({id: senderId, text: "حدث خطأ"});
                }
                botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_OFF}, async () => {
                  botly.sendText({id: senderId, text: response.data.choices[0].message.content,
                    quick_replies: [
                      botly.createQuickReply("👍", "up"),
                      botly.createQuickReply("👎", "down")]});
                });
              });
              } catch (error) {
                var reset = [];
                const data = {
                  "model": "gpt-3.5-turbo",
                  "messages": [
                    { "role": "user", "content": message.message.text }
                  ]
                };
                botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_ON}, async () => {
                  const response = await axios.post(`https://${process.env.SHHHH}/v1/chat/completions`, data, { headers });
                  reset.push({ "role": "user", "content": message.message.text }, { "role": "assistant", "content": response.data.choices[0].message.content });
                  await updateUser(senderId, {time: timer, data: reset })
                  .then((data, error) => {
                    if (error) {
                      botly.sendText({id: senderId, text: "حدث خطأ"});
                    }
                botly.sendAction({id: senderId, action: Botly.CONST.ACTION_TYPES.TYPING_OFF}, async () => {
                  botly.sendText({id: senderId, text: response.data.choices[0].message.content,
                    quick_replies: [
                      botly.createQuickReply("👍", "up"),
                      botly.createQuickReply("👎", "down")]});
                });
                });
              });
              }
            });
          }
        } else {
          await createUser({uid: senderId, time: timer, data: [] })
            .then((data, error) => {
              botly.sendButtons({
                id: senderId,
                text: "مرحبا 💬.\nأنا نوتي 🤗 روبوت ذكاء صناعي مدعم بـGPT 3.5 يمكنك سؤالي عن أي معلومات تحتاجها ✨\nاستطيع مساعدتك في كتابة النصوص و حل المشاكل البرمجية 🤓.\nيمكنك الان البدأ بإستعمالي ^-^",
                buttons: [
                  botly.createWebURLButton("حساب المطور 💻👤", "facebook.com/0xNoti/"),
                ],
              });
            });
        }
      });
      } else if (message.message.attachments[0].payload.sticker_id) {
        //botly.sendText({id: senderId, text: "(Y)"});
      } else if (message.message.attachments[0].type == "image") {
        botly.sendText({id: senderId, text: "المرجو إستعمال النصوص فقط"});
      } else if (message.message.attachments[0].type == "audio") {
        botly.sendText({id: senderId, text: "المرجو إستعمال النصوص فقط"});
      } else if (message.message.attachments[0].type == "video") {
        botly.sendText({id: senderId, text: "المرجو إستعمال النصوص فقط"});
      }
};
/* ----- POSTBACK ----- */

const onPostBack = async (senderId, message, postback) => {
  if (message.postback) {
    if (postback == "") {
      //
    } else if (postback == "") {
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (postback == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    } else if (message.postback.title == "") {
      //
    }
  } else {
    // Quick Reply
    if (message.message.text == "") {
      //
    } else if (message.message.text == "") {
      //
    } else if (postback == "up" || postback == "down") {
      botly.sendText({id: senderId, text: "شكرا لترك التقييم ♥"});
    }
  }
};
/* ----- HANDELS ----- */
app.listen(port, () => console.log(`App is on port : 3000`));