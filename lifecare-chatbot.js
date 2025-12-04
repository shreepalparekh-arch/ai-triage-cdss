// Popup controls
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

// Elements (they exist on every page)
const messagesEl = document.getElementById('chat-messages');
const userInputEl = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const quickRepliesEl = document.getElementById('quick-replies');

const riskEl = document.getElementById('summary-risk');
const stepEl = document.getElementById('summary-step');
const sumAgeEl = document.getElementById('sum-age');
const sumComplaintEl = document.getElementById('sum-complaint');
const sumRedEl = document.getElementById('sum-redflags');
const sumSeverityEl = document.getElementById('sum-severity');
const catEl = document.getElementById('summary-category');
const nextEl = document.getElementById('summary-next');

let state = {
  mode: 'triage', // triage or faq
  step: 0,
  ageGroup: null,
  mainComplaint: null,
  redFlags: null,
  severity: null
};

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
    1: 'Step 1 of 4',
    2: 'Step 2 of 4',
    3: 'Step 3 of 4',
    4: 'Step 4 of 4',
    5: 'Summary'
  };
  stepEl.textContent = map[state.step] || 'Step 1 of 4';
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
  addMessage('I can run a simple symptom triage demo or answer basic questions about Lifecare Hospital.');
  addMessage('This is an educational tool only and cannot provide medical advice.');
  addMessage('First, choose what you would like to do:');
  setQuickReplies([
    { label: 'Symptom triage demo', value: 'mode_triage' },
    { label: 'Hospital information', value: 'mode_faq' }
  ]);
  updateStepLabel();
}

function handleUserInput(raw, fromQuick = false) {
  if (!raw) return;
  const text = raw.trim();
  if (!text) return;

  const lower = text.toLowerCase();

  if (!fromQuick) {
    addMessage(text, 'user');
  }

  // Mode selection
  if (state.step === 1 && (lower === 'mode_triage' || lower === 'mode_faq')) {
    if (lower === 'mode_triage') {
      state.mode = 'triage';
      addMessage('Great, let us do a quick triage simulation.');
      addMessage('Select your age group: child, adult, or older adult.');
      setQuickReplies([
        { label: 'Child', value: 'child' },
        { label: 'Adult', value: 'adult' },
        { label: 'Older adult', value: 'older' }
      ]);
      state.step = 2;
      updateStepLabel();
    } else {
      state.mode = 'faq';
      addMessage('Sure, you can ask about departments, timings, appointments, or location.');
      addMessage('For example: "What are visiting hours?" or "Which department for chest pain?".');
      setQuickReplies([]);
      state.step = 10; // FAQ free‑chat state
      stepEl.textContent = 'Info mode';
    }
    return;
  }

  if (state.mode === 'faq' && state.step >= 10) {
    answerFaq(lower);
    return;
  }

  // TRIAGE FLOW
  if (state.step === 2) {
    const valid = ['child', 'adult', 'older', 'older adult'];
    if (!valid.includes(lower)) {
      addMessage('Please choose: child, adult, or older adult.');
      setQuickReplies([
        { label: 'Child', value: 'child' },
        { label: 'Adult', value: 'adult' },
        { label: 'Older adult', value: 'older' }
      ]);
      return;
    }
    state.ageGroup = (lower === 'older adult') ? 'older' : lower;
    sumAgeEl.textContent =
      state.ageGroup.charAt(0).toUpperCase() + state.ageGroup.slice(1);
    addMessage('Thank you. What is the main problem today?');
    addMessage('You can type something like "chest pain", "fever", "breathlessness", or "injury".');
    setQuickReplies([]);
    state.step = 3;
    updateStepLabel();
    return;
  }

  if (state.step === 3) {
    state.mainComplaint = lower;
    sumComplaintEl.textContent = raw;
    let q;
    if (lower.includes('chest')) {
      q = 'Do you have severe chest pain, sweating, or pain going to jaw/arm? (yes / no)';
    } else if (lower.includes('fever')) {
      q = 'Do you have confusion, stiff neck, rash, or trouble breathing with the fever? (yes / no)';
    } else if (lower.includes('breath')) {
      q = 'Is your breathlessness severe or getting rapidly worse? (yes / no)';
    } else if (lower.includes('injury') || lower.includes('trauma')) {
      q = 'Is there heavy bleeding, major deformity, or any loss of consciousness? (yes / no)';
    } else {
      q = 'Does this problem feel suddenly very severe or rapidly getting worse? (yes / no)';
    }
    addMessage(q);
    setQuickReplies([
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' }
    ]);
    state.step = 4;
    updateStepLabel();
    return;
  }

  if (state.step === 4) {
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
    return;
  }

  if (state.step === 5) {
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
    sumSeverityEl.textContent = lower.charAt(0).toUpperCase() + lower.slice(1);
    setQuickReplies([]);
    computeTriageResult();
    state.step = 6;
    updateStepLabel();
    addMessage('This summary is for learning only. For real concerns, please visit the emergency department or book an appointment.');
    addMessage('You can continue asking general hospital questions if you like.');
    state.mode = 'faq';
    state.step = 10;
    stepEl.textContent = 'Info mode';
    return;
  }
}

function computeTriageResult() {
  let risk = 'Low';
  let riskClass = 'risk-low';
  let category = 'General presentation';
  let next =
    'Monitor symptoms and arrange a consultation with a Lifecare clinician if anything worsens or persists.';

  const reasons = [];

  if (state.mainComplaint.includes('chest')) {
    category = 'Chest pain · possible cardiac or respiratory concern';
    reasons.push('chest symptoms');
  } else if (state.mainComplaint.includes('fever')) {
    category = 'Fever · possible infection or inflammatory illness';
    reasons.push('fever pattern');
  } else if (state.mainComplaint.includes('breath')) {
    category = 'Breathlessness · possible respiratory compromise';
    reasons.push('breathlessness');
  } else if (state.mainComplaint.includes('injury') || state.mainComplaint.includes('trauma')) {
    category = 'Injury/trauma‑related condition';
    reasons.push('injury mechanism');
  }

  if (state.redFlags) {
    reasons.push('red‑flag symptoms');
  }
  if (state.severity === 'high') {
    reasons.push('high severity');
  } else if (state.severity === 'moderate') {
    reasons.push('moderate severity');
  }

  if (state.redFlags || state.severity === 'high') {
    risk = 'High';
    riskClass = 'risk-high';
    next =
      'Highly urgent: go to Lifecare Emergency or the nearest emergency department immediately. Do not rely on this demo for decisions.';
  } else if (state.severity === 'moderate') {
    risk = 'Moderate';
    riskClass = 'risk-med';
    next =
      'Please book an appointment with a suitable specialist at Lifecare Hospital as soon as possible.';
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

// FAQ responses
function answerFaq(lower) {
  if (lower.includes('visiting') || lower.includes('visit hours') || lower.includes('timings')) {
    addMessage(
      'Visiting hours at Lifecare Hospital are typically in the late morning and early evening, with flexible ICU policies based on clinical need. For this demo, timings are illustrative only.'
    );
    return;
  }

  if (lower.includes('location') || lower.includes('where') || lower.includes('address')) {
    addMessage(
      'Lifecare Hospital is a fictional teaching hospital created for this academic project. In a real deployment, this would show a map, address and navigation links.'
    );
    return;
  }

  if (lower.includes('chest pain') || (lower.includes('which department') && lower.includes('chest'))) {
    addMessage(
      'For chest pain, especially with breathlessness or sweating, patients are usually seen by Emergency Medicine and Cardiology.'
    );
    addMessage('If this were real, you should visit the emergency department immediately rather than using a chatbot.');
    return;
  }

  if (lower.includes('which department') || lower.includes('which speciality')) {
    addMessage(
      'Lifecare departments include Cardiology, Emergency Medicine, Orthopaedics, Internal Medicine, Women & Child Health, and more.'
    );
    addMessage(
      'You can describe your symptom and I will suggest a likely speciality in the triage demo mode.'
    );
    return;
  }

  if (lower.includes('appointment') || lower.includes('book')) {
    addMessage(
      'To request a slot at Lifecare Hospital, use the Appointment page form. In a real system, your details would go directly to the scheduling team.'
    );
    return;
  }

  addMessage(
    "You can ask about departments, appointments, visiting hours, or use the symptom triage demo. For serious symptoms in real life, please contact emergency services."
  );
}

// Wire events (if elements exist)
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
