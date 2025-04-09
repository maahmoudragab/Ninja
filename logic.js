// API Constants
const API_KEY_GEMINI = `AIzaSyCX3pW4z83UHMYLoVLvo7OcHYOfTewBjsw`;
const API_URL_GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-exp-0827:generateContent?key=${API_KEY_GEMINI}`;

// DOM Elements
const ninja_body = document.querySelector(".ninja-body");
const message_input = document.querySelector(".message-input");
const send_message_btn = document.querySelector("#send-btn");
const file_input = document.querySelector("#file-input");
const send_image_btn = document.querySelector("#send-image");
const image_selected_div = document.querySelector(".image-selected");
const img_element = document.querySelector(".image-selected img");
const close_selceted = document.querySelector("#close-selected");
const themeToggle = document.getElementById("theme-toggle");

// User Data
const user_data = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

const chatHistory = [];

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    const isDarkMode = localStorage.getItem("theme") === "dark";
    document.body.classList.toggle("dark-mode", isDarkMode);
    updateToggleButton(isDarkMode);
    addEmojiMartTopage(localStorage.getItem("theme") || "light");
});

themeToggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    updateToggleButton(isDarkMode);
    addEmojiMartTopage(localStorage.getItem("theme") || "light");
});

message_input.addEventListener("keydown", (e) => {
    const user_message = e.target.value.trim();
    if (e.key === "Enter" && user_message) {
        handleMessage();
    }
});

send_message_btn.addEventListener("click", (e) => {
    if (message_input.value.trim()) {
        handleMessage();
    }
});

file_input.addEventListener("change", () => {
    const file = file_input.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
        img_element.src = e.target.result;
        image_selected_div.classList.add("show");
        user_data.file = {
            data: e.target.result.split(",")[1],
            mime_type: file.type
        };
        file_input.value = '';
    };

    reader.readAsDataURL(file);
});

send_image_btn.addEventListener("click", () => file_input.click());

close_selceted.addEventListener("click", () => {
    user_data.file = {};
    image_selected_div.classList.remove("show");
});

// Functions
function updateToggleButton(isDarkMode) {
    themeToggle.classList.toggle("bi-moon", !isDarkMode);
    themeToggle.classList.toggle("bi-brightness-high", isDarkMode);
    themeToggle.style.color = isDarkMode ? "#fff" : "#222";
}

function handleMessage() {
    user_data.message = message_input.value.trim();
    message_input.value = '';
    image_selected_div.classList.remove("show");
    if (document.querySelector(".ninja-body .welcome")) {
        ninja_body.innerHTML = '';
    }
    const create_message_element = `<div class="text-message"></div>
    ${user_data.file.data ? `<img src="data:${user_data.file.mime_type};base64,${user_data.file.data}" />` : ''}`;

    const handling = createMessageElement(create_message_element, "user-message");
    handling.querySelector(".text-message").textContent = user_data.message;
    ninja_body.appendChild(handling);
    ninja_body.scrollTo({
        top: ninja_body.scrollHeight,
        behavior: "smooth"
    });
    setTimeout(() => {
        const create_message_element = `<div class="message-text">
                <div class="loading-box">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>`;
        const handling = createMessageElement(create_message_element, "ninja-message");
        ninja_body.appendChild(handling);
        sendToNinja(handling);
    }, 400);
}

function createMessageElement(content, class_name) {
    const div = document.createElement("div");
    div.classList.add("message", class_name);
    div.innerHTML = content;
    return div;
}

async function sendToNinja(handling) {
    const message_element = handling.querySelector(".message-text");
    chatHistory.push({
        role: "user",
        parts: [{ text: user_data.message }, user_data.file.data ? { inline_data: user_data.file } : []]
    });

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    };

    try {
        const response = await fetch(API_URL_GEMINI, requestOptions);
        const data = await response.json();

        console.log(data);
        if (!response.ok) throw new Error(data.error.message);

        const api_response = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        message_element.innerText = api_response;
        chatHistory.push({
            role: "user",
            parts: [{ text: api_response }]
        });

        // Check if the response is Arabic
        if (isArabic(api_response)) {
            message_element.style.direction = "rtl";
            message_element.style.textAlign = "right";
        } else {
            message_element.style.direction = "ltr";
            message_element.style.textAlign = "left";
        }

    } catch (e) {
        message_element.textContent = "There is a problem with our server. We will solve it as soon as possible. Thank you.";
        message_element.style.color = '#ff00e2';
    } finally {
        user_data.file = {};
        ninja_body.scrollTo({
            top: ninja_body.scrollHeight,
            behavior: "smooth"
        });
    }
}

function addEmojiMartTopage(theme) {
    if (document.querySelector("em-emoji-picker")) document.querySelector("em-emoji-picker").remove();
    const picker = new EmojiMart.Picker({
        theme: theme,
        skinTonePosition: "none",
        previewPosition: "none",
        searchPosition: "none",
        onEmojiSelect: (emoji_Selected) => {
            const { selectionStart: start, selectionEnd: end } = message_input;
            message_input.setRangeText(emoji_Selected.native, start, end, "end");
            message_input.focus();
        },
        onClickOutside: (e) => {
            if (e.target.id === "emoji-picker") {
                document.body.classList.toggle("show-emoji-picker");
            } else {
                document.body.classList.remove("show-emoji-picker");
            }
        }
    });
    document.querySelector(".ninja-footer").appendChild(picker);
}

function isArabic(text) {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
}
