// 🔹 form-logger.js（あなたの Firebase 用に調整済み）
// 🔸 type="module" で読み込む必要があります

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// ✅ Firebase構成（あなたのプロジェクト用）
const firebaseConfig = {
  apiKey: "AIzaSyDwQshILHqKVIlnO5dBEK1T5F2XhMqgP2s",
  authDomain: "form-tool-stark.firebaseapp.com",
  projectId: "form-tool-stark",
  storageBucket: "form-tool-stark.appspot.com",
  messagingSenderId: "668648297156",
  appId: "1:668648297156:web:94e8b349342685f442ef91"
};

// 🔧 Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ユーザーID（クライアント識別）を scriptタグの data-userid から取得
const userId = document.currentScript.getAttribute("data-userid") || "unknown";

// セッション識別子
const sessionId = crypto.randomUUID();
const pageUrl = window.location.href;
const timestamp = Date.now();
const scrollEvents = [];
const formEvents = [];

// 📏 スクロール監視
window.addEventListener("scroll", () => {
  const percent = Math.round(
    (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
  );
  scrollEvents.push({ percent, timestamp: Date.now() });
});

// 📝 フォーム入力監視
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

// 📤 Firestoreへ送信
function sendData(status, formId) {
  const data = {
    userId,
    sessionId,
    pageUrl,
    formId,
    status, // "submitted" or "abandon"
    timestamp,
    events: formEvents,
    scrollEvents
  };

  addDoc(collection(db, "form_logs"), data)
    .then(() => console.log("✅ Firestore送信成功！"))
    .catch(err => console.error("❌ Firestore送信失敗:", err));
}

// 🚀 DOM読み込み後に実行
document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll("form");
  forms.forEach(trackForm);
});
