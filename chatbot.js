// Popup controls
function openChatbot() {
  document.getElementById('chatbot-overlay').style.display = 'flex';
  if (!window.chatStarted) {
    window.chatStarted = true;
    startConversation();
  }
}
function closeChatbot() {
  document.getElementById('chatbot-overlay').style.display = 'none';
}
function overlayClick(e) {
  if (e.target.id === 'chatbot-overlay') {
    closeChatbot();
  }
}

// Chat elements
const messagesEl = document.getElementById('chat-messages');
const userInputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const quickRepliesEl = document.getElementById('quick-replies');

// Summary elements
const riskEl = document.getElementById('summary-risk');
const stepEl = document.getElementById('summary-step');
const sumAgeEl = document.getElementById('sum-age');
const sumComplaintEl = document.getElementById('sum-complaint');
const sumRedEl = document.getElementById('sum-redflags');
const sumSeverityEl = document.getElementById('sum-severity');
const catEl = document.getElementById('summary-category');
const nextEl = document.getElementById('summary-next');

// Conversation state
let state = {
  step: 0,
  ageGroup: null,
  mainComplaint: null,
  redFlags: null,
  severity: null
};

function addMessage(text, sender = 'bot') {
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setQuickReplies(options) {
  quickRepliesEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.textContent = opt.label;
    btn.onclick = () => handleUserInput(opt.value, true);
    quickRepliesEl.appendChild(btn);
  });
}

function updateSummaryStep() {
  const mapping = {1: 'Step 1 of 4', 2: 'Step 2 of 4', 3: 'Step 3 of 4', 4: 'Step 4 of 4', 5: 'Summary'};
  stepEl.textContent = mapping[state.step] || 'Step 1 of 4';
}

function resetRiskChip() {
  riskEl.className = 'risk-chip risk-none';
  riskEl.textContent = 'Risk: –';
}

function startConversation() {
  messagesEl.innerHTML = '';
  quickRepliesEl.innerHTML = '';
  resetRiskChip();
  sumAgeEl.textContent = '–';
  sumComplaintEl.textContent = '–';
  sumRedEl.textContent = '–';
  sumSeverityEl.textContent = '–';
  catEl.textContent = 'Possible category: –';
  nextEl.textContent = 'Next step suggestion will appear once the triage is complete.';

  state = {step: 1, ageGroup: null, mainComplaint: null, redFlags: null, severity: null};

  addMessage('Welcome to the AICare Triage Assistant demo.');
  addMessage('This is an educational simulator only; it cannot give medical advice or replace a clinician.');
  addMessage('First, choose your age group:');
  setQuickReplies([
    {label: 'Child', value: 'child'},
    {label: 'Adult', value: 'adult'},
    {label: 'Older adult', value: 'older'}
  ]);
  updateSummaryStep();
}

function handleUserInput(rawText, fromQuick = false) {
  const text = rawText.trim();
  if (!text) return;

  if (!fromQuick) {
    addMessage(text, 'user');
  }

  const cleaned = text.toLowerCase();

  // STEP 1: Age group
  if (state.step === 1) {
    const valid = ['child', 'adult', 'older', 'older adult'];
    if (!valid.includes(cleaned)) {
      addMessage('Please select: child, adult, or older adult.');
      setQuickReplies([
        {label: 'Child', value: 'child'},
        {label: 'Adult', value: 'adult'},
        {label: 'Older adult', value: 'older'}
      ]);
      return;
    }
    state.ageGroup = (cleaned === 'older adult') ? 'older' : cleaned;
    sumAgeEl.textContent = state.ageGroup.charAt(0).toUpperCase() + state.ageGroup.slice(1);
    addMessage('Got it. Now, what is the main problem today?');
    addMessage('You can type something like: "chest pain", "fever", "breathlessness", or "injury".');
    setQuickReplies([]);
    state.step = 2;
    updateSummaryStep();
    return;
  }

  // STEP 2: Main complaint
  if (state.step === 2) {
    state.mainComplaint = cleaned;
    sumComplaintEl.textContent = text;
    let question;
    if (cleaned.includes('chest')) {
      question = 'Do you have severe chest pain, sweating, or pain going to jaw/arm? (yes / no)';
    } else if (cleaned.includes('fever')) {
      question = 'Do you have confusion, stiff neck, rash, or trouble breathing with the fever? (yes / no)';
    } else if (cleaned.includes('breath') || cleaned.includes('breathing')) {
      question = 'Is your breathlessness severe or getting rapidly worse? (yes / no)';
    } else if (cleaned.includes('injury') || cleaned.includes('trauma')) {
      question = 'Is there heavy bleeding, major deformity, or any loss of consciousness? (yes / no)';
    } else {
      question = 'Does this problem feel suddenly very severe or rapidly getting worse? (yes / no)';
    }
    addMessage(question);
    setQuickReplies([
      {label: 'Yes', value: 'yes'},
      {label: 'No', value: 'no'}
    ]);
    state.step = 3;
    updateSummaryStep();
    return;
  }

  // STEP 3: Red flags
  if (state.step === 3) {
    if (['yes', 'y', 'no', 'n'].indexOf(cleaned) === -1) {
      addMessage('Please answer yes or no.');
      setQuickReplies([
        {label: 'Yes', value: 'yes'},
        {label: 'No', value: 'no'}
      ]);
      return;
    }
    state.redFlags = (cleaned === 'yes' || cleaned === 'y');
    sumRedEl.textContent = state.redFlags ? 'Present' : 'None reported';
    addMessage('How severe do the symptoms feel overall?');
    addMessage('Choose one: low, moderate, or high.');
    setQuickReplies([
      {label: 'Low', value: 'low'},
      {label: 'Moderate', value: 'moderate'},
      {label: 'High', value: 'high'}
    ]);
    state.step = 4;
    updateSummaryStep();
    return;
  }

  // STEP 4: Severity
  if (state.step === 4) {
    if (!['low', 'moderate', 'high'].includes(cleaned)) {
      addMessage('Please choose: low, moderate, or high.');
      setQuickReplies([
        {label: 'Low', value: 'low'},
        {label: 'Moderate', value: 'moderate'},
        {label: 'High', value: 'high'}
      ]);
      return;
    }
    state.severity = cleaned;
    sumSeverityEl.textContent = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    setQuickReplies([]);
    computeResult();
    state.step = 5;
    updateSummaryStep();
    addMessage('This triage cycle is complete. You can open the assistant again later to simulate another case.');
    return;
  }

  // After summary
  if (state.step === 5) {
    addMessage('To restart a fresh triage, close this window and open the assistant again.');
  }
}

function computeResult() {
  let risk = 'Low';
  let riskClass = 'risk-low';
  let category = 'General presentation';
  let next = 'Monitor symptoms closely and seek medical advice if anything worsens or feels unsafe.';
  let reasons = [];

  if (state.mainComplaint.includes('chest')) {
    category = 'Chest pain / possible cardiac or respiratory issue';
    reasons.push('chest symptoms');
  } else if (state.mainComplaint.includes('fever')) {
    category = 'Fever / possible infection or inflammatory illness';
    reasons.push('fever pattern');
  } else if (state.mainComplaint.includes('breath')) {
    category = 'Breathlessness / possible respiratory compromise';
    reasons.push('breathlessness');
  } else if (state.mainComplaint.includes('injury') || state.mainComplaint.includes('trauma')) {
    category = 'Trauma or injury‑related condition';
    reasons.push('injury mechanism');
  }

  if (state.redFlags) {
    reasons.push('presence of red‑flag symptoms');
  }
  if (state.severity === 'high') {
    reasons.push('high subjective severity');
  } else if (state.severity === 'moderate') {
    reasons.push('moderate severity');
  }

  // Determine risk
  if (state.redFlags || state.severity === 'high') {
    risk = 'High';
    riskClass = 'risk-high';
    next = 'Highly urgent: attend an emergency department or urgent care service immediately, and do not rely on this demo.';
  } else if (state.severity === 'moderate') {
    risk = 'Moderate';
    riskClass = 'risk-med';
    next = 'Arrange an in‑person assessment with a clinician as soon as possible.';
  }

  riskEl.className = 'risk-chip ' + riskClass;
  riskEl.textContent = 'Risk: ' + risk;
  catEl.textContent = 'Possible category: ' + category;

  let reasonText = '';
  if (reasons.length) {
    reasonText = 'Reasoning (demo): this level was chosen because of ' + reasons.join(', ') + '. ';
  }
  nextEl.textContent = reasonText + next;
}

// Wire events
if (sendBtn && userInputEl) {
  sendBtn.addEventListener('click', () => {
    const val = userInputEl.value;
    userInputEl.value = '';
    addMessage(val, 'user');
    handleUserInput(val, true); // reuse logic but we already printed user msg
  });

  userInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = userInputEl.value;
      userInputEl.value = '';
      addMessage(val, 'user');
      handleUserInput(val, true);
    }
  });
}
