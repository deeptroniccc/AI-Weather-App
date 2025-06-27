//  WeatherAPI key
const weatherApiKey = '7c47eec0cbf7423e9ae161727252706';
const weatherApiUrl = 'https://api.weatherapi.com/v1/current.json';

//  Gemini API key
const geminiApiKey = 'AIzaSyDQ5XJlcwxuM_wOrUxTt4nL8eNnl4OD5X4';
const geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

//  Get all important elements from the HTML
const locationText = document.getElementById('location');
const weatherIcon = document.getElementById('weather-emoji');
const tempText = document.getElementById('temperature');
const conditionText = document.getElementById('description');
const humidityText = document.getElementById('humidity');
const windText = document.getElementById('wind-speed');
const pressureText = document.getElementById('pressure');
const feelsLikeText = document.getElementById('feels-like');
const errorBox = document.getElementById('error-message');
const loadingBox = document.getElementById('loading-message');

//  Chat elements
const openChatBtn = document.getElementById('chat-button');
const chatBox = document.getElementById('chatbot-container');
const closeChatBtn = document.getElementById('close-chatbot');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-message');
const chatMessages = document.getElementById('chatbot-messages');

let currentTemp = '--°C'; // to store temperature globally

//  Convert weather text to emoji
function getWeatherEmoji(text) {
  const lower = text.toLowerCase();
  if (lower.includes('clear')) return '☀️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('drizzle')) return '🌦️';
  if (lower.includes('thunder')) return '⛈️';
  if (lower.includes('snow')) return '❄️';
  if (lower.includes('mist') || lower.includes('fog') || lower.includes('haze')) return '🌫️';
  return '🌡️';
}

//  Show or hide loading and error
function showLoading() {
  loadingBox.style.display = 'block';
  errorBox.style.display = 'none';
}
function hideLoading() {
  loadingBox.style.display = 'none';
}
function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
  hideLoading();
}

//  Fill weather data in the UI
function displayWeather(data) {
  currentTemp = `${data.current.temp_c.toFixed(1)}°C`;
  locationText.textContent = `${data.location.name}, ${data.location.country}`;
  tempText.textContent = currentTemp;
  conditionText.textContent = data.current.condition.text;
  weatherIcon.textContent = getWeatherEmoji(data.current.condition.text);
  humidityText.textContent = `${data.current.humidity}%`;
  windText.textContent = `${data.current.wind_kph} kph`;
  pressureText.textContent = `${data.current.pressure_mb} hPa`;
  feelsLikeText.textContent = `${data.current.feelslike_c.toFixed(1)}°C`;
  hideLoading();
}

//  Get weather info using coordinates
function fetchWeather(lat, lon) {
  showLoading();
  const url = `${weatherApiUrl}?key=${weatherApiKey}&q=${lat},${lon}`;
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Weather fetch failed');
      return response.json();
    })
    .then(data => displayWeather(data))
    .catch(error => {
      console.error(error);
      showError('Could not get weather. Maybe wrong API key or location blocked.');
    });
}

//  Get user location
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        fetchWeather(lat, lon);
      },
      error => {
        console.error(error);
        showError('Please allow location permission.');
      }
    );
  } else {
    showError('Your browser does not support location.');
  }
}

//  Add message to chat
function addChatMessage(text, isUser) {
  const msg = document.createElement('div');
  msg.className = isUser ? 'message user-message' : 'message ai-message';
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ✨ Show typing dots
function showTypingDots() {
  const typing = document.createElement('div');
  typing.id = 'typing';
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

//  Remove typing dots
function removeTypingDots() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

//  Ask Gemini with user message and weather context
async function askGeminiAI(userMsg) {
  const prompt = `Current temperature is ${currentTemp}. ${userMsg}`;
  showTypingDots();

  try {
    const res = await fetch(`${geminiApiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) throw new Error('Gemini fetch failed');
    const data = await res.json();
    removeTypingDots();

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry! AI didn't reply.";
    addChatMessage(reply, false);
  } catch (error) {
    console.error(error);
    removeTypingDots();
    addChatMessage(" AI error. Check your key.", false);
  }
}

// Handle sending messages
function handleSendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addChatMessage(text, true);
  chatInput.value = '';
  askGeminiAI(text);
}

//  Event Listeners
openChatBtn.addEventListener('click', () => {
  chatBox.style.display = 'flex';
  openChatBtn.style.display = 'none';
  chatInput.focus();
});

closeChatBtn.addEventListener('click', () => {
  chatBox.style.display = 'none';
  openChatBtn.style.display = 'flex';
});

sendBtn.addEventListener('click', handleSendMessage);

chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') handleSendMessage();
});

//  Start everything
getUserLocation();
