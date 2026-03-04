/* ── State ──────────────────────────────────────────────────────────────── */
const STATE = {
  sessionId: null,
  phase: 'setup',
  maxPhaseIdx: 0,
};

let LANG = localStorage.getItem('hr_demo_lang') || 'en';
const SESSION_KEY = 'hr_demo_session_id';

/* ── Translations ────────────────────────────────────────────────────────── */
const STRINGS = {
  en: {
    lang_btn: '🌐 Español',
    nav: { setup: 'Job Setup', cv: 'CV Review', hr: 'HR Interview', tech: 'Tech Interview', report: 'Report' },
    setup: {
      title: 'Define the Job Position',
      desc: "Describe the role you're hiring for. Our AI will use this to screen candidates throughout the pipeline.",
      card_title: 'Job Details',
      btn_example: 'Load Example',
      lbl_title: 'Job Title', lbl_desc: 'Job Description',
      lbl_exp: 'Experience Required', lbl_salary: 'Salary Range',
      lbl_skills: 'Required Skills', lbl_skills_hint: '(comma-separated)',
      ph_title: 'e.g. Senior Python Backend Engineer',
      ph_desc: 'Describe the role, responsibilities, and team context...',
      ph_exp: 'e.g. 4+ years', ph_salary: 'e.g. €70,000 - €90,000',
      ph_skills: 'Python, FastAPI, PostgreSQL, Docker',
      btn_submit: 'Start Recruitment Pipeline',
    },
    cv: {
      title: 'CV Screening',
      desc: "Paste the candidate's CV below. Our AI will score it against the job requirements.",
      card_title: 'Candidate CV', ph: "Paste the candidate's CV / resume here...",
      btn_screen: 'Screen CV with AI', result_title: 'Screening Result',
      strengths: 'Strengths', gaps: 'Gaps', recommendation: 'Recommendation',
      badge_strong: 'Strong Match', badge_moderate: 'Moderate Match', badge_poor: 'Poor Match',
      btn_upload: '📎 Upload File (PDF/TXT)',
      uploading: 'Reading...',
      btn_proceed_hr: 'Continue to HR Interview →',
      btn_proceed_report: 'View Report (Score too low for interviews) →',
    },
    hr: {
      title: 'Initial HR Interview',
      desc: 'Chat with our AI HR interviewer. Respond as the candidate would.',
      ph: 'Type your response as the candidate...',
      label: 'HR Interviewer', candidate: 'Candidate',
      complete_text: 'HR Interview Complete',
      btn_next: 'Continue to Technical Interview →',
      btn_end: 'End Interview',
    },
    tech: {
      title: 'Technical Interview',
      desc: 'A senior engineer will now assess your technical skills.',
      ph: 'Type your technical response...',
      label: 'Technical Interviewer', candidate: 'Candidate',
      complete_text: 'Technical Interview Complete',
      btn_next: 'View Final Report →',
      btn_end: 'End Interview',
    },
    report: {
      title: 'Final Assessment Report',
      desc: 'Comprehensive AI-generated evaluation of the candidate.',
      loading: 'Generating comprehensive report...',
      breakdown: 'Score Breakdown',
      lbl_cv: 'CV Screening', lbl_hr: 'HR Interview', lbl_tech: 'Technical',
      strengths: 'Strengths', concerns: 'Concerns',
      next_steps: 'Recommended Next Steps', btn_restart: 'Start New Recruitment',
    },
    controls: { prev: '← Back', refresh: '↺ Refresh', next: 'Next →' },
  },
  es: {
    lang_btn: '🌐 English',
    nav: { setup: 'Puesto', cv: 'Revisión CV', hr: 'Entrevista RRHH', tech: 'Entrevista Técnica', report: 'Informe' },
    setup: {
      title: 'Define el Puesto de Trabajo',
      desc: 'Describe el puesto que buscas cubrir. La IA lo usará para evaluar candidatos en todo el proceso.',
      card_title: 'Detalles del Puesto',
      btn_example: 'Cargar Ejemplo',
      lbl_title: 'Título del Puesto', lbl_desc: 'Descripción del Puesto',
      lbl_exp: 'Experiencia Requerida', lbl_salary: 'Rango Salarial',
      lbl_skills: 'Habilidades Requeridas', lbl_skills_hint: '(separadas por coma)',
      ph_title: 'ej. Ingeniero Backend Senior en Python',
      ph_desc: 'Describe el puesto, responsabilidades y contexto del equipo...',
      ph_exp: 'ej. 4+ años', ph_salary: 'ej. €70.000 - €90.000',
      ph_skills: 'Python, FastAPI, PostgreSQL, Docker',
      btn_submit: 'Iniciar Pipeline de Selección',
    },
    cv: {
      title: 'Evaluación de CV',
      desc: 'Pega el CV del candidato. La IA lo puntuará en base a los requisitos del puesto.',
      card_title: 'CV del Candidato', ph: 'Pega aquí el CV del candidato...',
      btn_screen: 'Evaluar CV con IA', result_title: 'Resultado de la Evaluación',
      strengths: 'Puntos Fuertes', gaps: 'Carencias', recommendation: 'Recomendación',
      badge_strong: 'Alta Coincidencia', badge_moderate: 'Coincidencia Moderada', badge_poor: 'Baja Coincidencia',
      btn_upload: '📎 Subir Archivo (PDF/TXT)',
      uploading: 'Leyendo...',
      btn_proceed_hr: 'Continuar a Entrevista RRHH →',
      btn_proceed_report: 'Ver Informe (Puntuación insuficiente para entrevistas) →',
    },
    hr: {
      title: 'Entrevista Inicial RRHH',
      desc: 'Chatea con nuestro entrevistador de RRHH con IA. Responde como lo haría el candidato.',
      ph: 'Escribe tu respuesta como candidato...',
      label: 'Entrevistador RRHH', candidate: 'Candidato',
      complete_text: 'Entrevista RRHH Completada',
      btn_next: 'Continuar a Entrevista Técnica →',
      btn_end: 'Finalizar Entrevista',
    },
    tech: {
      title: 'Entrevista Técnica',
      desc: 'Un ingeniero senior evaluará ahora tus habilidades técnicas.',
      ph: 'Escribe tu respuesta técnica...',
      label: 'Entrevistador Técnico', candidate: 'Candidato',
      complete_text: 'Entrevista Técnica Completada',
      btn_next: 'Ver Informe Final →',
      btn_end: 'Finalizar Entrevista',
    },
    report: {
      title: 'Informe de Evaluación Final',
      desc: 'Evaluación completa del candidato generada por IA.',
      loading: 'Generando informe completo...',
      breakdown: 'Desglose de Puntuación',
      lbl_cv: 'Evaluación CV', lbl_hr: 'Entrevista RRHH', lbl_tech: 'Técnica',
      strengths: 'Puntos Fuertes', concerns: 'Preocupaciones',
      next_steps: 'Próximos Pasos Recomendados', btn_restart: 'Nueva Contratación',
    },
    controls: { prev: '← Atrás', refresh: '↺ Refrescar', next: 'Siguiente →' },
  },
};

/* ── i18n ────────────────────────────────────────────────────────────────── */
function applyLang(lang) {
  LANG = lang;
  localStorage.setItem('hr_demo_lang', lang);
  const s = STRINGS[lang];
  const set = (id, text) => { const e = document.getElementById(id); if (e) e.textContent = text; };
  const qs  = (sel, text) => { const e = document.querySelector(sel); if (e) e.textContent = text; };
  const ph  = (id, text) => { const e = document.getElementById(id); if (e) e.placeholder = text; };

  // Header
  set('btn-lang', s.lang_btn);
  document.querySelectorAll('.step-label').forEach((el, i) => {
    const keys = [s.nav.setup, s.nav.cv, s.nav.hr, s.nav.tech, s.nav.report];
    if (keys[i]) el.textContent = keys[i];
  });

  // Panel 1: Setup
  qs('#panel-setup h1', s.setup.title);
  qs('#panel-setup .panel-header p', s.setup.desc);
  qs('#panel-setup .card-title', s.setup.card_title);
  set('btn-load-example', s.setup.btn_example);
  qs('label[for="job-title"]', s.setup.lbl_title);
  qs('label[for="job-description"]', s.setup.lbl_desc);
  qs('label[for="job-experience"]', s.setup.lbl_exp);
  qs('label[for="job-salary"]', s.setup.lbl_salary);
  // Skills label has a child <span class="hint">
  const skillsLabel = document.querySelector('label[for="job-skills"]');
  if (skillsLabel) {
    skillsLabel.childNodes[0].textContent = s.setup.lbl_skills + ' ';
    const hint = skillsLabel.querySelector('.hint');
    if (hint) hint.textContent = s.setup.lbl_skills_hint;
  }
  ph('job-title', s.setup.ph_title);
  ph('job-description', s.setup.ph_desc);
  ph('job-experience', s.setup.ph_exp);
  ph('job-salary', s.setup.ph_salary);
  ph('job-skills', s.setup.ph_skills);
  qs('#btn-submit-job .btn-text', s.setup.btn_submit);

  // Panel 2: CV
  qs('#panel-cv_review h1', s.cv.title);
  qs('#panel-cv_review .panel-header p', s.cv.desc);
  qs('#panel-cv_review .two-col > .card .card-title', s.cv.card_title);
  ph('cv-text', s.cv.ph);
  const uploadLbl = $('btn-upload-cv');
  if (uploadLbl && !uploadLbl.classList.contains('loading')) uploadLbl.textContent = s.cv.btn_upload;
  qs('#btn-screen-cv .btn-text', s.cv.btn_screen);
  qs('#cv-result-card .card-title', s.cv.result_title);
  document.querySelectorAll('#cv-result-card .result-section h4').forEach((el, i) => {
    el.textContent = [s.cv.strengths, s.cv.gaps, s.cv.recommendation][i] || el.textContent;
  });

  // Panel 3: HR Interview
  qs('#panel-initial_interview h1', s.hr.title);
  qs('#panel-initial_interview .panel-header p', s.hr.desc);
  ph('initial-chat-input', s.hr.ph);
  set('hr-complete-text', s.hr.complete_text);
  set('btn-to-tech-interview', s.hr.btn_next);
  set('btn-initial-end', s.hr.btn_end);

  // Panel 4: Technical Interview
  qs('#panel-technical_interview h1', s.tech.title);
  qs('#panel-technical_interview .panel-header p', s.tech.desc);
  ph('tech-chat-input', s.tech.ph);
  set('tech-complete-text', s.tech.complete_text);
  set('btn-to-report', s.tech.btn_next);
  set('btn-tech-end', s.tech.btn_end);

  // Panel 5: Report
  qs('#panel-report h1', s.report.title);
  qs('#panel-report .panel-header p', s.report.desc);
  qs('#report-loading p', s.report.loading);
  set('report-breakdown-title', s.report.breakdown);
  document.querySelectorAll('.breakdown-label').forEach((el, i) => {
    el.textContent = [s.report.lbl_cv, s.report.lbl_hr, s.report.lbl_tech][i] || el.textContent;
  });
  set('report-strengths-title', s.report.strengths);
  set('report-concerns-title', s.report.concerns);
  set('report-next-steps-title', s.report.next_steps);
  set('btn-restart', s.report.btn_restart);

  // Demo controls
  set('btn-nav-prev', s.controls.prev);
  set('btn-nav-refresh', s.controls.refresh);
  set('btn-nav-next', s.controls.next);
}

/* ── Utilities ──────────────────────────────────────────────────────────── */
function $(id) { return document.getElementById(id); }

function toast(msg, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' toast-error' : '');
  el.textContent = msg;
  $('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const loader = btn.querySelector('.btn-loader');
  btn.disabled = loading;
  if (text) text.classList.toggle('hidden', loading);
  if (loader) loader.classList.toggle('hidden', !loading);
}

/* ── Panel navigation ───────────────────────────────────────────────────── */
const PHASES = ['setup', 'cv_review', 'initial_interview', 'technical_interview', 'report'];

function showPanel(phase) {
  STATE.phase = phase;
  const idx = PHASES.indexOf(phase);
  if (idx > STATE.maxPhaseIdx) STATE.maxPhaseIdx = idx;
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + phase);
  if (panel) panel.classList.add('active');
  updatePipelineNav(phase);
  updateNavControls();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePipelineNav(activePhase) {
  const idx = PHASES.indexOf(activePhase);
  document.querySelectorAll('.pipeline-step').forEach((step, i) => {
    step.classList.remove('active', 'done');
    if (i === idx) step.classList.add('active');
    else if (i < idx) step.classList.add('done');
  });
}

/* ── Session init ───────────────────────────────────────────────────────── */
async function initSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const status = await api('GET', `/api/session/${saved}/status`);
      STATE.sessionId = saved;
      restoreFromStatus(status);
      return;
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }
  const { session_id } = await api('POST', '/api/session');
  STATE.sessionId = session_id;
  localStorage.setItem(SESSION_KEY, session_id);
  showPanel('setup');
}

function restoreFromStatus(status) {
  const phase = status.phase;
  STATE.maxPhaseIdx = PHASES.indexOf(phase);
  // Restore language if session already has one set
  if (status.language && status.language !== LANG) {
    LANG = status.language;
    localStorage.setItem('hr_demo_lang', LANG);
    applyLang(LANG);
  }
  if (phase === 'setup') { showPanel('setup'); return; }
  if (phase === 'cv_review') { showPanel('cv_review'); return; }
  if (phase === 'initial_interview') { showPanel('initial_interview'); startInitialInterview(); return; }
  if (phase === 'technical_interview') { showPanel('technical_interview'); startTechnicalInterview(); return; }
  if (phase === 'report') { showPanel('report'); loadReport(); return; }
}

/* ── Language toggle ────────────────────────────────────────────────────── */
$('btn-lang').addEventListener('click', async () => {
  const newLang = LANG === 'en' ? 'es' : 'en';
  applyLang(newLang);
  if (STATE.sessionId) {
    try { await api('PUT', `/api/session/${STATE.sessionId}/language?lang=${newLang}`); }
    catch (_) { /* silent — UI already updated */ }
  }
});

/* ── Panel 1: Job Setup ─────────────────────────────────────────────────── */
$('btn-load-example').addEventListener('click', async () => {
  try {
    const job = await api('GET', `/api/session/${STATE.sessionId}/example-job`);
    $('job-title').value = job.title;
    $('job-description').value = job.description;
    $('job-skills').value = job.skills.join(', ');
    $('job-experience').value = job.experience;
    $('job-salary').value = job.salary;
  } catch (e) { toast(e.message, true); }
});

$('job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setLoading('btn-submit-job', true);
  try {
    const body = {
      title: $('job-title').value.trim(),
      description: $('job-description').value.trim(),
      skills: $('job-skills').value.split(',').map(s => s.trim()).filter(Boolean),
      experience: $('job-experience').value.trim(),
      salary: $('job-salary').value.trim(),
    };
    await api('POST', `/api/session/${STATE.sessionId}/job?lang=${LANG}`, body);
    showPanel('cv_review');
  } catch (e) { toast(e.message, true); }
  finally { setLoading('btn-submit-job', false); }
});

/* ── Panel 2: CV Screening ──────────────────────────────────────────────── */
$('btn-screen-cv').addEventListener('click', async () => {
  const cvText = $('cv-text').value.trim();
  if (!cvText) { toast(LANG === 'es' ? 'Por favor pega un CV primero.' : 'Please paste a CV first.', true); return; }
  setLoading('btn-screen-cv', true);
  $('cv-result-card').classList.add('hidden');
  try {
    const { cv_result, phase } = await api('POST', `/api/session/${STATE.sessionId}/cv`, { cv_text: cvText });
    renderCVResult(cv_result, phase);
  } catch (e) { toast(e.message, true); }
  finally { setLoading('btn-screen-cv', false); }
});

/* ── CV file upload ──────────────────────────────────────────────────────── */
$('cv-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  $('cv-upload-filename').textContent = file.name;
  const lbl = $('btn-upload-cv');
  lbl.textContent = STRINGS[LANG].cv.uploading;
  lbl.classList.add('loading');

  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/session/${STATE.sessionId}/cv/parse-file`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    const { text } = await res.json();
    $('cv-text').value = text;
    toast(LANG === 'es' ? 'CV cargado correctamente.' : 'CV loaded successfully.');
  } catch (err) {
    toast(err.message, true);
    $('cv-upload-filename').textContent = '';
  } finally {
    lbl.textContent = STRINGS[LANG].cv.btn_upload;
    lbl.classList.remove('loading');
    e.target.value = '';
  }
});

function renderCVResult(result, phase) {
  const score = result.score;
  const s = STRINGS[LANG].cv;
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  const ring = $('ring-progress');
  ring.style.strokeDashoffset = offset;

  let color, badgeClass, badgeText;
  if (score >= 70) { color = '#059669'; badgeClass = 'badge-green'; badgeText = s.badge_strong; }
  else if (score >= 50) { color = '#D97706'; badgeClass = 'badge-yellow'; badgeText = s.badge_moderate; }
  else { color = '#DC2626'; badgeClass = 'badge-red'; badgeText = s.badge_poor; }

  ring.style.stroke = color;
  $('score-value').textContent = score;
  $('score-value').style.color = color;

  const badge = $('score-badge');
  badge.className = 'score-badge ' + badgeClass;
  badge.textContent = badgeText;

  renderList('cv-strengths', result.strengths);
  renderList('cv-gaps', result.gaps);
  $('cv-recommendation').textContent = result.recommendation;

  const proceedBtn = $('btn-proceed-interview');
  if (phase === 'report') {
    proceedBtn.textContent = s.btn_proceed_report;
    proceedBtn.onclick = () => { showPanel('report'); loadReport(); };
  } else {
    proceedBtn.textContent = s.btn_proceed_hr;
    proceedBtn.onclick = () => { showPanel('initial_interview'); startInitialInterview(); };
  }

  $('cv-result-card').classList.remove('hidden');
}

function renderList(id, items) {
  const el = $(id);
  el.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

/* ── Panel 3: Initial Interview ─────────────────────────────────────────── */
let initialStarted = false;

async function startInitialInterview() {
  if (initialStarted) return;
  initialStarted = true;
  const messagesEl = $('initial-chat-messages');
  messagesEl.innerHTML = '';
  appendTyping(messagesEl);
  try {
    const { message } = await api('GET', `/api/session/${STATE.sessionId}/initial-interview/start`);
    removeTyping(messagesEl);
    appendBubble(messagesEl, 'assistant', message, STRINGS[LANG].hr.label);
    enableChatInput('initial-chat-input', 'btn-initial-send');
    $('btn-initial-end').disabled = false;
  } catch (e) {
    removeTyping(messagesEl);
    toast(e.message, true);
  }
}

$('btn-initial-send').addEventListener('click', () => sendInterviewMessage('initial'));
$('initial-chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInterviewMessage('initial'); }
});

$('btn-initial-end').addEventListener('click', async () => {
  $('btn-initial-end').disabled = true;
  try {
    await api('POST', `/api/session/${STATE.sessionId}/initial-interview/end`);
    disableChatInput('initial-chat-input', 'btn-initial-send');
    $('initial-interview-complete').classList.remove('hidden');
  } catch (e) {
    toast(e.message, true);
    $('btn-initial-end').disabled = false;
  }
});

async function sendInterviewMessage(type) {
  const inputId = type + '-chat-input';
  const sendBtnId = 'btn-' + type + '-send';
  const endBtnId  = 'btn-' + type + '-end';
  const messagesEl = $(type + '-chat-messages');
  const input = $(inputId);
  const msg = input.value.trim();
  if (!msg) return;

  input.value = '';
  input.disabled = true;
  $(sendBtnId).disabled = true;
  if ($(endBtnId)) $(endBtnId).disabled = true;

  const label = type === 'initial' ? STRINGS[LANG].hr.candidate : STRINGS[LANG].tech.candidate;
  appendBubble(messagesEl, 'user', msg, label);
  appendTyping(messagesEl);

  const endpoint = type === 'initial' ? 'initial-interview' : 'technical-interview';
  try {
    const { message, is_complete } = await api(
      'POST', `/api/session/${STATE.sessionId}/${endpoint}/message`, { message: msg }
    );
    removeTyping(messagesEl);
    const aiLabel = type === 'initial' ? STRINGS[LANG].hr.label : STRINGS[LANG].tech.label;
    appendBubble(messagesEl, 'assistant', message, aiLabel);

    if (is_complete) {
      disableChatInput(inputId, sendBtnId);
      if ($(endBtnId)) $(endBtnId).disabled = true;
      const completeBannerId = type === 'initial' ? 'initial-interview-complete' : 'tech-interview-complete';
      $(completeBannerId).classList.remove('hidden');
    } else {
      enableChatInput(inputId, sendBtnId);
      if ($(endBtnId)) $(endBtnId).disabled = false;
    }
  } catch (e) {
    removeTyping(messagesEl);
    toast(e.message, true);
    enableChatInput(inputId, sendBtnId);
    if ($(endBtnId)) $(endBtnId).disabled = false;
  }
}

$('btn-to-tech-interview').addEventListener('click', () => {
  showPanel('technical_interview');
  startTechnicalInterview();
});

/* ── Panel 4: Technical Interview ──────────────────────────────────────── */
let techStarted = false;

async function startTechnicalInterview() {
  if (techStarted) return;
  techStarted = true;
  const messagesEl = $('tech-chat-messages');
  messagesEl.innerHTML = '';
  appendTyping(messagesEl);
  try {
    const { message } = await api('GET', `/api/session/${STATE.sessionId}/technical-interview/start`);
    removeTyping(messagesEl);
    appendBubble(messagesEl, 'assistant', message, STRINGS[LANG].tech.label);
    enableChatInput('tech-chat-input', 'btn-tech-send');
    $('btn-tech-end').disabled = false;
  } catch (e) {
    removeTyping(messagesEl);
    toast(e.message, true);
  }
}

$('btn-tech-send').addEventListener('click', () => sendInterviewMessage('tech'));
$('tech-chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInterviewMessage('tech'); }
});

$('btn-tech-end').addEventListener('click', async () => {
  $('btn-tech-end').disabled = true;
  try {
    await api('POST', `/api/session/${STATE.sessionId}/technical-interview/end`);
    disableChatInput('tech-chat-input', 'btn-tech-send');
    $('tech-interview-complete').classList.remove('hidden');
  } catch (e) {
    toast(e.message, true);
    $('btn-tech-end').disabled = false;
  }
});

$('btn-to-report').addEventListener('click', () => {
  showPanel('report');
  loadReport();
});

/* ── Panel 5: Report ────────────────────────────────────────────────────── */
async function loadReport() {
  $('report-loading').classList.remove('hidden');
  $('report-content').classList.add('hidden');
  try {
    const report = await api('GET', `/api/session/${STATE.sessionId}/report`);
    renderReport(report);
    $('report-loading').classList.add('hidden');
    $('report-content').classList.remove('hidden');
  } catch (e) {
    $('report-loading').classList.add('hidden');
    toast(e.message, true);
  }
}

function renderReport(report) {
  const score = report.overall_score;
  const circumference = 314;
  const offset = circumference - (score / 100) * circumference;
  const ring = $('report-ring-progress');
  ring.style.strokeDashoffset = offset;

  let color;
  if (score >= 70) color = '#059669';
  else if (score >= 50) color = '#D97706';
  else color = '#DC2626';
  ring.style.stroke = color;

  $('report-score-value').textContent = score;
  $('report-score-value').style.color = color;

  const badge = $('report-recommendation-badge');
  const rec = report.recommendation;
  badge.textContent = rec;
  badge.className = 'recommendation-badge ' + (
    rec === 'Strong Hire' || rec === 'Contratar con Urgencia' ? 'badge-green' :
    rec === 'Hire'        || rec === 'Contratar'               ? 'badge-green' :
    rec === 'Consider'    || rec === 'Considerar'              ? 'badge-yellow' : 'badge-red'
  );

  setBar('bar-cv',   'bar-cv-val',   report.cv_score);
  setBar('bar-hr',   'bar-hr-val',   report.initial_interview_score);
  setBar('bar-tech', 'bar-tech-val', report.technical_interview_score);

  renderList('report-strengths', report.strengths);
  renderList('report-concerns',  report.concerns);
  renderOrderedList('report-next-steps', report.next_steps);
}

function setBar(barId, valId, score) {
  setTimeout(() => {
    $(barId).style.width = score + '%';
    $(valId).textContent = score;
  }, 100);
}

function renderOrderedList(id, items) {
  const el = $(id);
  el.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    el.appendChild(li);
  });
}

$('btn-restart').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

/* ── Demo navigation controls ───────────────────────────────────────────── */
function updateNavControls() {
  const idx = PHASES.indexOf(STATE.phase);
  $('btn-nav-prev').disabled = (idx === 0);
  $('btn-nav-next').disabled = (idx >= STATE.maxPhaseIdx);
}

$('btn-nav-prev').addEventListener('click', () => {
  const idx = PHASES.indexOf(STATE.phase);
  if (idx > 0) showPanel(PHASES[idx - 1]);
});

$('btn-nav-next').addEventListener('click', () => {
  const idx = PHASES.indexOf(STATE.phase);
  if (idx < STATE.maxPhaseIdx) showPanel(PHASES[idx + 1]);
});

$('btn-nav-refresh').addEventListener('click', () => location.reload());

/* ── Chat helpers ───────────────────────────────────────────────────────── */
function appendBubble(container, role, text, label) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bubble-wrapper bubble-wrapper-' + (role === 'user' ? 'user' : 'assistant');
  const meta = document.createElement('div');
  meta.className = 'bubble-meta';
  meta.textContent = label;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble bubble-' + (role === 'user' ? 'user' : 'assistant');
  bubble.textContent = text;
  wrapper.appendChild(meta);
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

function appendTyping(container) {
  const el = document.createElement('div');
  el.className = 'chat-typing';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    el.appendChild(dot);
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

function removeTyping(container) {
  const el = container.querySelector('.chat-typing');
  if (el) el.remove();
}

function enableChatInput(inputId, btnId) {
  $(inputId).disabled = false;
  $(btnId).disabled = false;
  $(inputId).focus();
}

function disableChatInput(inputId, btnId) {
  $(inputId).disabled = true;
  $(btnId).disabled = true;
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
applyLang(LANG);
initSession().catch(e => toast('Failed to initialize session: ' + e.message, true));
