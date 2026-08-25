import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectIntent,
  detectLanguage,
  handleCustomerTurn,
  isRobotic,
  voiceProfileFor,
} from "../src/lib/language";

test("detects Hindi, English and Hinglish including code-switch", () => {
  assert.equal(detectLanguage("क्या रेट है?"), "hi");
  assert.equal(detectLanguage("Can you send me the invoice?"), "en");
  assert.equal(detectLanguage("Price kya hai?"), "hinglish");
  assert.equal(detectLanguage("Bhai kal delivery ho jayegi?"), "hinglish");
  assert.equal(detectLanguage("50 pieces chahiye, delivery tomorrow."), "hinglish");
  assert.equal(detectLanguage("Bhai woh 12 watt ke Philips bulb ka rate kya hai?"), "hinglish");
});

test("replies in the same register and never invents a price", () => {
  const hinglish = handleCustomerTurn({
    text: "Bhai woh 12 watt ke Philips bulb ka rate kya hai?",
    channel: "whatsapp",
    employeeName: "Rahul",
    businessName: "Sharma Electricals",
  });
  assert.equal(hinglish.language, "hinglish");
  assert.equal(hinglish.intent, "price");
  assert.equal(hinglish.needsTool, true);
  assert.match(hinglish.reply, /catalogue|catalog|confirm/i);
  assert.doesNotMatch(hinglish.reply, /₹\s*\d|rs\.?\s*\d/i);
  assert.equal(isRobotic(hinglish.reply), false);

  const english = handleCustomerTurn({
    text: "Can you send me the invoice?",
    channel: "whatsapp",
    employeeName: "Rahul",
    businessName: "Sharma Electricals",
  });
  assert.equal(english.language, "en");
  assert.match(english.reply, /bill|invoice/i);

  const hindiMix = handleCustomerTurn({
    text: "Bhai kal delivery ho jayegi?",
    channel: "phone",
    employeeName: "Rahul",
    businessName: "Sharma Electricals",
  });
  assert.equal(hindiMix.language, "hinglish");
  assert.match(hindiMix.reply.toLowerCase(), /kal|address|delivery/);
});

test("haan / nahi and natural shop words map to confirmations", () => {
  assert.equal(detectIntent("Haan."), "confirm_yes");
  assert.equal(detectIntent("Haan ji"), "confirm_yes");
  assert.equal(detectIntent("Theek hai"), "confirm_yes");
  assert.equal(detectIntent("Nahi"), "confirm_no");
});

test("voice uses Indian locales, never US English", () => {
  assert.equal(voiceProfileFor("en").locale, "en-IN");
  assert.equal(voiceProfileFor("hi").locale, "hi-IN");
  assert.equal(voiceProfileFor("hinglish").locale, "hi-IN");
  const turn = handleCustomerTurn({
    text: "Bhai kal tak bhej dena.",
    channel: "phone",
    employeeName: "Neha",
    businessName: "Gupta Traders",
  });
  assert.equal(turn.voice.accent, "indian");
  assert.equal(turn.voice.locale, "hi-IN");
  assert.match(turn.voice.ssml, /hi-IN/);
});

test("identity does not pretend to be a human", () => {
  const turn = handleCustomerTurn({
    text: "Are you a real person?",
    channel: "whatsapp",
    employeeName: "Rahul",
    businessName: "Sharma Electricals",
  });
  assert.match(turn.reply.toLowerCase(), /ai sales employee/);
  assert.doesNotMatch(turn.reply.toLowerCase(), /i am a real (person|human)/);
});

test("verified price may be spoken; unverified must not", () => {
  const withFact = handleCustomerTurn({
    text: "12 watt bulb ka rate?",
    channel: "whatsapp",
    employeeName: "Rahul",
    businessName: "Sharma Electricals",
    verified: { productName: "Philips 12W LED", priceLabel: "₹85", stockOk: true },
  });
  assert.match(withFact.reply, /₹85/);
  assert.equal(withFact.needsTool, false);
});

test("Karol Bagh with a pincode is an address, not a delivery-time chat", () => {
  assert.equal(detectIntent("Delivery Karol Bagh, Delhi 110005"), "address");
  assert.equal(detectIntent("Bhai kal delivery ho jayegi?"), "delivery_when");
  assert.equal(detectIntent("Maine pay kar diya"), "payment_done");
});

test("feedback is a distinct intent, not a fake CSAT score", () => {
  assert.equal(detectIntent("Service achi lagi"), "feedback");
  assert.equal(detectIntent("Maal theek hai, santusht hoon"), "feedback");
});
