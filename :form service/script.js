// form-logger.js (type="module" 指定必須)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.11/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.11/firebase-firestore.js";

// ==================== Firebase config ====================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "yourproject.firebaseapp.com",
  projectId: "yourproject-id",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== ユーティリティ ====================
const sessionId = crypto.randomUUID();
const userId = document.currentScript.getAttribute("data-userid") || "unknown";
const pageUrl = window.location.href;
const timestamp = Date.now();
const scrollEvents = [];
const formEvents = [];

// ==================== スクロール監視 ====================
window.addEventListener("scroll", () => {
  const percent = Math.round(
    (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
  );
  scrollEvents.push({ percent, timestamp: Date.now() });
});

// ==================== フォーム入力監視 ====================
function trackForm(form) {
  const formId = form.getAttribute("id") || "auto_form_" + Math.random().toString(36).substr(2, 5);
  const fields = form.querySelectorAll("input, textarea, select");

  fields.forEach((field, index) => {
    const name = field.name || field.id || `unnamed_${index}`;
    let startTime = null;

    field.addEventListener("focus", () => {
      startTime = Date.now();
      formEvents.push({ field: name, type: "focus", order: index, timestamp: Date.now() });
    });

    field.addEventListener("blur", () => {
      const duration = startTime ? Date.now() - startTime : 0;
      const hasValue = !!field.value;
      formEvents.push({
        field: name,
        type: "blur",
        order: index,
        hasValue,
        duration,
        timestamp: Date.now()
      });
    });
  });

  form.addEventListener("submit", () => {
    formEvents.push({ type: "submit", timestamp: Date.now() });
    sendData("submitted", formId);
  });

  window.addEventListener("beforeunload", () => {
    const hasSubmitted = formEvents.some(e => e.type === "submit");
    if (!hasSubmitted) {
      sendData("abandon", formId);
    }
  });
}

// ==================== データ送信 ====================
function sendData(status, formId) {
  addDoc(collection(db, "form_logs"), {
    userId,
    sessionId,
    pageUrl,
    formId,
    status, // "submitted" or "abandon"
    timestamp,
    events: formEvents,
    scrollEvents
  }).catch(err => console.error("データ送信エラー:", err));
}

// ==================== 初期化 ====================
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");
  forms.forEach(trackForm);
});
