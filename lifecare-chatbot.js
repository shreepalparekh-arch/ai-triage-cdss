// ===== POPUP CONTROLS =====
function openChatbot() {
  const overlay = document.getElementById('chatbot-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  if (!window.lifecareChatStarted) {
    window.lifecareChatStarted = true;
    startConversation();
  }
}

function closeChatbot() {
  const overlay = document.getElementById('chatbot-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
}

function overlayClick(e) {
  if (e.target.id === 'chatbot-overlay') {
    closeChatbot();
  }
}

// ===== ELEMENTS =====
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

// ===== STATE =====
let state = {
  mode: 'triage',   // "triage" or "faq"
  step: 0,
  ageGroup: null,
  mainComplaint: null,
  redFlags: null,
  severity: null
};

// ===== UTILITIES =====
function addMessage(text, sender = 'bot') {
  if (!messagesEl) return;
  const div = document.createElement('div');
  div.className = 'message ' + sender;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setQuickReplies(options) {
  if (!quickRepliesEl) return;
  quickRepliesEl.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.textContent = opt.label;
    btn.onclick = () => handleUserInput(opt.value, true);
    quickRepliesEl.appendChild(btn);
  });
}

function updateStepLabel() {
  if (!stepEl) return;
  const map = {
    1: 'Choose mode',
    2: 'Step 1 of 4',
    3: 'Step 2 of 4',
    4: 'Step 3 of 4',
    5: 'Step 4 of 4',
    6: 'Summary'
  };
  stepEl.textContent = map[state.step] || 'Choose mode';
}

function resetSummary() {
  if (!riskEl) return;
  riskEl.className = 'risk-chip risk-none';
  riskEl.textContent = 'Risk: –';
  sumAgeEl.textContent = '–';
  sumComplaintEl.textContent = '–';
  sumRedEl.textContent = '–';
  sumSeverityEl.textContent = '–';
  catEl.textContent = 'Possible category: –';
  nextEl.textContent = 'Complete the questions to see a suggested next step.';
}

// ===== START CONVERSATION =====
function startConversation() {
  if (!messagesEl) return;
  messagesEl.innerHTML = '';
  resetSummary();

  state = {
    mode: 'triage',
    step: 1,
    ageGroup: null,
    mainComplaint: null,
    redFlags: null,
    severity: null
  };

  addMessage('Welcome to Lifecare Assistant.');
  addMessage('This educational chatbot focuses on diagnosis and clinical decision support at Lifecare Hospital.');
  addMessage('I can run a symptom triage demo or answer questions about Lifecare and our clinical support services.');
  addMessage('Please choose how you want to start:');
  setQuickReplies([
    { label: 'Symptom triage', value: 'mode_triage' },
    { label: 'Ask a question', value: 'mode_faq' }
  ]);
  updateStepLabel();
}

// ===== MAIN HANDLER =====
function handleUserInput(raw, fromQuick = false) {
  if (!raw) return;
  const text = raw.trim();
  if (!text) return;

  const lower = text.toLowerCase();

  if (!fromQuick) {
    addMessage(text, 'user');
  }

  // Step 1: mode selection
  if (state.step === 1 && (lower === 'mode_triage' || lower === 'mode_faq')) {
    if (lower === 'mode_triage') {
      startTriageFlow();
    } else {
      startFaqFlow();
    }
    return;
  }

  // If user types mode keywords directly
  if (state.step === 1 && (lower.includes('triage') || lower.includes('symptom'))) {
    startTriageFlow();
    return;
  }
  if (state.step === 1 && (lower.includes('question') || lower.includes('info') || lower.includes('information'))) {
    startFaqFlow();
    return;
  }

  // FAQ mode
  if (state.mode === 'faq' && state.step >= 10) {
    answerFaq(lower);
    return;
  }

  // TRIAGE FLOW
  if (state.mode === 'triage') {
    if (state.step === 2) {
      handleAgeStep(lower);
      return;
    }
    if (state.step === 3) {
      handleComplaintStep(text, lower);
      return;
    }
    if (state.step === 4) {
      handleRedFlagStep(lower);
      return;
    }
    if (state.step === 5) {
      handleSeverityStep(lower);
      return;
    }
  }

  if (state.step === 0) {
    startConversation();
  }
}

// ===== TRIAGE HELPERS =====
function startTriageFlow() {
  state.mode = 'triage';
  state.step = 2;
  addMessage('Okay, let us run a brief symptom triage demo.');
  addMessage('Select your age group: child, adult, or older adult.');
  setQuickReplies([
    { label: 'Child', value: 'child' },
    { label: 'Adult', value: 'adult' },
    { label: 'Older adult', value: 'older adult' }
  ]);
  updateStepLabel();
}

function handleAgeStep(lower) {
  const valid = ['child', 'adult', 'older', 'older adult'];
  if (!valid.includes(lower)) {
    addMessage('Please choose: child, adult, or older adult.');
    setQuickReplies([
      { label: 'Child', value: 'child' },
      { label: 'Adult', value: 'adult' },
      { label: 'Older adult', value: 'older adult' }
    ]);
    return;
  }
  state.ageGroup = (lower === 'older adult') ? 'older' : lower;
  sumAgeEl.textContent =
    state.ageGroup.charAt(0).toUpperCase() + state.ageGroup.slice(1);

  addMessage('Thank you. What is the main problem today?');
  addMessage('You can say things like "chest pain", "high fever", "breathlessness", or "injury".');
  setQuickReplies([]);
  state.step = 3;
  updateStepLabel();
}

function handleComplaintStep(raw, lower) {
  state.mainComplaint = lower;
  sumComplaintEl.textContent = raw;

  let question;
  if (lower.includes('chest')) {
    question = 'Do you have severe chest pain, sweating, or pain going to jaw/arm? (yes / no)';
  } else if (lower.includes('fever')) {
    question = 'Do you have confusion, stiff neck, rash, or trouble breathing with the fever? (yes / no)';
  } else if (lower.includes('breath')) {
    question = 'Is your breathlessness severe or getting rapidly worse? (yes / no)';
  } else if (lower.includes('injury') || lower.includes('trauma')) {
    question = 'Is there heavy bleeding, major deformity, or any loss of consciousness? (yes / no)';
  } else {
    question = 'Does this problem feel suddenly very severe or rapidly getting worse? (yes / no)';
  }

  addMessage(question);
  setQuickReplies([
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ]);
  state.step = 4;
  updateStepLabel();
}

function handleRedFlagStep(lower) {
  if (!['yes', 'y', 'no', 'n'].includes(lower)) {
    addMessage('Please answer yes or no.');
    setQuickReplies([
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ]);
    return;
  }

  state.redFlags = (lower === 'yes' || lower === 'y');
  sumRedEl.textContent = state.redFlags ? 'Present' : 'None reported';

  addMessage('How severe do the symptoms feel overall? low, moderate, or high?');
  setQuickReplies([
    { label: 'Low', value: 'low' },
    { label: 'Moderate', value: 'moderate' },
    { label: 'High', value: 'high' }
  ]);
  state.step = 5;
  updateStepLabel();
}

function handleSeverityStep(lower) {
  if (!['low', 'moderate', 'high'].includes(lower)) {
    addMessage('Please choose: low, moderate, or high.');
    setQuickReplies([
      { label: 'Low', value: 'low' },
      { label: 'Moderate', value: 'moderate' },
      { label: 'High', value: 'high' }
    ]);
    return;
  }

  state.severity = lower;
  sumSeverityEl.textContent =
    lower.charAt(0).toUpperCase() + lower.slice(1);

  setQuickReplies([]);
  computeTriageResult();
  state.step = 6;
  updateStepLabel();

  addMessage('This triage summary is a demo and cannot be used for diagnosis or treatment.');
  addMessage('You can now ask general questions about Lifecare or type "start triage" to simulate another case.');
  state.mode = 'faq';
  state.step = 10;
  stepEl.textContent = 'Info mode';
}

// ===== TRIAGE RESULT =====
function computeTriageResult() {
  let risk = 'Low';
  let riskClass = 'risk-low';
  let category = 'General presentation';
  let next =
    'Monitor symptoms and arrange a consultation with a Lifecare clinician if anything worsens or persists.';

  const reasons = [];

  if (state.mainComplaint.includes('chest')) {
    category = 'Chest pain – possible cardiac or respiratory concern';
    reasons.push('chest‑related symptoms');
  } else if (state.mainComplaint.includes('fever')) {
    category = 'Fever – possible infection or inflammatory illness';
    reasons.push('fever pattern');
  } else if (state.mainComplaint.includes('breath')) {
    category = 'Breathlessness – possible respiratory compromise';
    reasons.push('breathlessness');
  } else if (state.mainComplaint.includes('injury') || state.mainComplaint.includes('trauma')) {
    category = 'Injury / trauma‑related condition';
    reasons.push('injury mechanism');
  }

  if (state.redFlags) reasons.push('red‑flag symptoms');
  if (state.severity === 'high') reasons.push('high subjective severity');
  if (state.severity === 'moderate') reasons.push('moderate severity');

  if (state.redFlags || state.severity === 'high') {
    risk = 'High';
    riskClass = 'risk-high';
    next =
      'Highly urgent: go to Lifecare Emergency or the nearest emergency department immediately. Do not rely on this demo for real decisions.';
  } else if (state.severity === 'moderate') {
    risk = 'Moderate';
    riskClass = 'risk-med';
    next =
      'Please book an appointment with an appropriate specialist at Lifecare Hospital as soon as possible.';
  }

  riskEl.className = 'risk-chip ' + riskClass;
  riskEl.textContent = 'Risk: ' + risk;
  catEl.textContent = 'Possible category: ' + category;

  let reasonText = '';
  if (reasons.length) {
    reasonText =
      'Reasoning (demo): this level is based on ' + reasons.join(', ') + '. ';
  }
  nextEl.textContent = reasonText + next;
}

// ===== FAQ MODE =====
function startFaqFlow() {
  state.mode = 'faq';
  state.step = 10;
  resetSummary();
  stepEl.textContent = 'Info mode';
  addMessage('Great, you can ask about Lifecare services, diagnosis support, departments, timings, or AI Clinical Decision Support.');
  addMessage('Examples: "Which department for chest pain?", "What is clinical decision support?", "How does AI help diagnosis?"');
  setQuickReplies([
    { label: 'What is CDSS?', value: 'what is clinical decision support' },
    { label: 'AI in diagnosis', value: 'how does ai help diagnosis' },
    { label: 'Departments list', value: 'which departments' }
  ]);
}

function answerFaq(lower) {
  if (/(hi|hello|hey)\b/.test(lower)) {
    addMessage('Hello from Lifecare Hospital. You can ask about services, appointments, departments, or run a symptom triage demo.');
    return;
  }

  if (lower.includes('clinical decision support') || lower.includes('cdss')) {
    addMessage(
      'Clinical Decision Support Systems (CDSS) are tools that combine patient data, guidelines, and risk models to help clinicians make safer, more consistent decisions.'
    );
    addMessage(
      'At Lifecare (demo), CDSS concepts power triage risk scoring, red‑flag alerts, and likely diagnosis suggestions, with clinicians always making the final call.'
    );
    return;
  }

  if (lower.includes('ai') && (lower.includes('diagnosis') || lower.includes('triage') || lower.includes('support'))) {
    addMessage(
      'AI can recognise patterns across symptoms, vitals, labs, and imaging to highlight high‑risk patients and narrow down possible diagnoses.'
    );
    addMessage(
      'Our demo assistant shows how such AI could support Lifecare doctors by estimating risk bands and broad diagnostic categories.'
    );
    return;
  }

  if (lower.includes('department') || lower.includes('speciality') || lower.includes('specialty')) {
    addMessage(
      'Key departments at Lifecare include Emergency Medicine, Internal Medicine, Cardiology, Orthopaedics, Women & Child Health, and Diagnostics.'
    );
    addMessage(
      'For emergency symptoms like chest pain or severe breathlessness, Emergency Medicine and Cardiology are usually involved.'
    );
    return;
  }

  if (lower.includes('chest pain')) {
    addMessage(
      'Chest pain, especially if sudden, heavy, or associated with breathlessness or sweating, is considered high‑risk.'
    );
    addMessage(
      'In real life, you should go straight to an emergency department. The Lifecare triage demo only illustrates how clinicians might prioritise such cases.'
    );
    return;
  }

  if (lower.includes('appointment') || lower.includes('book') || lower.includes('booking')) {
    addMessage(
      'You can request a slot through the Appointment page form. In a real hospital, this would securely notify the scheduling team.'
    );
    addMessage('Use the “Appointments” link in the top menu to open the booking form.');
    return;
  }

  if (lower.includes('visiting') || lower.includes('visit hours') || lower.includes('timings')) {
    addMessage(
      'Typical visiting hours include fixed morning and evening slots, with flexible ICU policies depending on the patient’s condition.'
    );
    addMessage(
      'Because this is an academic demo, these timings are illustrative placeholders rather than live operational data.'
    );
    return;
  }

  if (lower.includes('where') && lower.includes('located') || lower.includes('location') || lower.includes('address')) {
    addMessage(
      'Lifecare Hospital here is a fictional teaching hospital created to demonstrate diagnosis and clinical decision support concepts.'
    );
    addMessage('On a real site, you would see maps, routes, and verified contact numbers.');
    return;
  }

  if (lower.includes('start triage') || lower.includes('symptom triage')) {
    resetSummary();
    startTriageFlow();
    return;
  }

  addMessage(
    'Thank you for your question. I can help with topics like departments, appointments, visiting hours, and AI‑based clinical decision support.'
  );
  addMessage('If you want to simulate a case, type "start triage". For real health concerns, please visit a doctor or emergency department.');
}

// ===== EVENT WIRING =====
if (sendBtn && userInputEl) {
  sendBtn.addEventListener('click', () => {
    const val = userInputEl.value;
    userInputEl.value = '';
    addMessage(val, 'user');
    handleUserInput(val, true);
  });

  userInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = userInputEl.value;
      userInputEl.value = '';
      addMessage(val, 'user');
      handleUserInput(val, true);
    }
  });
}
