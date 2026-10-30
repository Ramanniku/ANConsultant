document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

  // Mobile navigation
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Attestation mega-menu: hover on desktop, click/tap toggle everywhere.
  document.querySelectorAll('.nav-mega-wrap').forEach(wrapper => {
    const trigger = wrapper.querySelector('.nav-mega-trigger');
    const panel = wrapper.querySelector('.nav-mega');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', event => {
      event.preventDefault();
      const opening = panel.hidden;
      document.querySelectorAll('.nav-mega').forEach(other => { other.hidden = true; });
      document.querySelectorAll('.nav-mega-trigger').forEach(other => other.setAttribute('aria-expanded', 'false'));
      panel.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
    });
    document.addEventListener('click', event => {
      if (!wrapper.contains(event.target)) {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
    });
  });

  const PCC_KEY = 'gulfbridge_demo_pcc_enquiries';
  const AGENT_KEY = 'gulfbridge_demo_agent_referrals';
  const JOBS_KEY = 'gulfbridge_demo_job_profiles';
  const CONTACT_KEY = 'gulfbridge_demo_contact_enquiries';
  const CAREER_KEY = 'gulfbridge_demo_career_applications';
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readList = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const saveList = (key, items) => localStorage.setItem(key, JSON.stringify(items));
  const newId = () => (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  };
  const formatDateTime = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };
  const csvDownload = (filename, headers, keys, entries) => {
    const cell = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = [headers.map(cell).join(','), ...entries.map(entry => keys.map(key => cell(entry[key])).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff', csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const addDetail = (label, value) => `<div class="detail-item"><small>${safe(label)}</small><strong>${safe(value || '—')}</strong></div>`;

  // Admin-published jobs are shared between the public Careers page and agent dashboard in this browser demo.
  const renderJobCards = (jobs, container) => {
    if (!container) return;
    container.innerHTML = jobs.map(job => `<article class="job-card managed-job-card" data-job-id="${safe(job.id)}">
      ${job.photo ? `<img class="managed-job-image" src="${job.photo}" alt="${safe(job.jobName)}">` : '<div class="job-symbol">✦</div>'}
      <div class="job-info"><span class="job-type">PUBLISHED OPPORTUNITY</span><h3>${safe(job.jobName)}</h3>
        <p>${safe(job.description || job.responsibilities || 'Contact us for more information.').replace(/\n/g, '<br>')}</p>
      </div>
      <button class="btn btn-primary btn-small view-job-btn" type="button">View Details</button>
      <div class="job-full-details" hidden><p>${safe(job.description || job.responsibilities || 'Contact us for more information.').replace(/\n/g, '<br>')}</p></div>
    </article>`).join('');
  };
  const publicJobsContainer = document.getElementById('managed-jobs-list');
  const renderPublicJobs = () => renderJobCards(readList(JOBS_KEY), publicJobsContainer);
  renderPublicJobs();

  // Agent dashboard Careers page.
  const agentJobsContainer = document.getElementById('agent-jobs-list');
  const agentJobsEmpty = document.getElementById('agent-jobs-empty');
  const agentJobCount = document.getElementById('agent-job-count');
  const renderAgentJobs = () => {
    const jobs = readList(JOBS_KEY);
    renderJobCards(jobs, agentJobsContainer);
    if (agentJobsEmpty) agentJobsEmpty.classList.toggle('empty-hidden', jobs.length > 0);
    if (agentJobCount) agentJobCount.textContent = `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`;
  };
  renderAgentJobs();
  document.querySelectorAll('[data-agent-view]').forEach(tab => tab.addEventListener('click', () => {
    const view = tab.dataset.agentView;
    document.querySelectorAll('[data-agent-view]').forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.agent-dashboard-view').forEach(section => { section.hidden = section.id !== `agent-${view}-view`; });
    if (view === 'careers') renderAgentJobs();
  }));

  // Careers search filters both sample jobs and jobs published by the demo admin.
  const jobSearchInput = document.getElementById('job-search-input');
  const clearJobSearch = document.getElementById('clear-job-search');
  const jobSearchEmpty = document.getElementById('job-search-empty');
  const filterJobs = () => {
    if (!jobSearchInput) return;
    const query = jobSearchInput.value.trim().toLocaleLowerCase();
    const cards = [...document.querySelectorAll('#jobs-list .job-card, #managed-jobs-list .job-card')];
    let visible = 0;
    cards.forEach(card => {
      const title = card.querySelector('.job-info h3')?.textContent?.toLocaleLowerCase() || '';
      const matches = !query || title.includes(query);
      card.hidden = !matches;
      if (matches) visible++;
    });
    if (jobSearchEmpty) jobSearchEmpty.hidden = visible > 0;
  };
  if (jobSearchInput) jobSearchInput.addEventListener('input', filterJobs);
  if (clearJobSearch) clearJobSearch.addEventListener('click', () => {
    if (jobSearchInput) { jobSearchInput.value = ''; filterJobs(); jobSearchInput.focus(); }
  });
  filterJobs();

  // Careers: open a right-side details drawer for both sample and admin-added jobs.
  const jobDrawer = document.getElementById('job-drawer');
  const jobDrawerBackdrop = document.getElementById('job-drawer-backdrop');
  const jobDrawerTitle = document.getElementById('job-drawer-title');
  const jobDrawerContent = document.getElementById('job-drawer-content');
  const closeJobDrawer = () => {
    if (!jobDrawer || !jobDrawerBackdrop) return;
    jobDrawer.classList.remove('open');
    jobDrawerBackdrop.classList.remove('visible');
    jobDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('job-drawer-open');
    window.setTimeout(() => { jobDrawerBackdrop.hidden = true; }, 220);
  };
  const isCareersPage = !!document.getElementById('job-search-input');
  const drawerEyebrow = jobDrawer ? jobDrawer.querySelector('.eyebrow') : null;
  let currentJobCard = null;
  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const jobInfoFromCard = card => {
    const title = card.querySelector('.job-info h3')?.textContent?.trim() || 'Job';
    return { id: card.dataset.jobId || `sample-${slug(title)}`, title };
  };

  const fillJobDrawer = card => {
    const info = card.querySelector('.job-info');
    const title = info?.querySelector('h3')?.textContent?.trim() || 'Job details';
    const fullDetails = card.querySelector('.job-full-details');
    const contactPanel = card.querySelector('.job-contact-panel');
    if (drawerEyebrow) drawerEyebrow.textContent = 'JOB DETAILS';
    jobDrawerTitle.textContent = title;
    const jobImage = card.querySelector('.managed-job-image');
    if (jobImage) {
      const description = info?.querySelector('p')?.innerHTML || fullDetails?.innerHTML || '';
      jobDrawerContent.innerHTML = `<div class="job-detail-split"><img class="job-detail-photo" src="${jobImage.getAttribute('src')}" alt="${safe(title)}"><div class="job-detail-copy"><h3>${safe(title)}</h3><p>${description}</p></div></div>`;
    } else {
      jobDrawerContent.innerHTML = `<div class="job-drawer-description">${info ? info.innerHTML : ''}</div>`;
      if (fullDetails) jobDrawerContent.insertAdjacentHTML('beforeend', `<div class="job-drawer-extra">${fullDetails.innerHTML}</div>`);
    }
    // Apply button (public Careers page only)
    if (isCareersPage) {
      jobDrawerContent.insertAdjacentHTML('beforeend', `<div class="job-apply-wrap"><button type="button" class="btn btn-primary btn-full" id="apply-job-btn">Apply for this job →</button></div>`);
    }
    if (contactPanel) {
      jobDrawerContent.insertAdjacentHTML('beforeend', `<div class="job-drawer-contact"><h3>Contact us about this job</h3>${contactPanel.innerHTML}</div>`);
    } else {
      jobDrawerContent.insertAdjacentHTML('beforeend', `<div class="job-drawer-contact"><h3>Interested in this job?</h3><p>Contact our team to confirm availability and application requirements.</p><p><strong>Phone:</strong> <a href="tel:+910000000000">+91 00000 00000</a></p><p><strong>WhatsApp:</strong> <a href="https://wa.me/910000000000" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p><p><strong>Email:</strong> <a href="mailto:your-email@example.com">your-email@example.com</a></p></div>`);
    }
    jobDrawerContent.scrollTop = 0;
  };

  // Job application form (same fields as the agent referral form + Category).
  const showApplyForm = card => {
    if (!card || !jobDrawerContent) return;
    const job = jobInfoFromCard(card);
    if (drawerEyebrow) drawerEyebrow.textContent = 'JOB APPLICATION';
    jobDrawerContent.innerHTML = `<button type="button" class="apply-back" id="apply-back-btn">← Back to job details</button>
      <div class="apply-banner">Applying for: <strong>${safe(job.title)}</strong></div>
      <div class="privacy-banner"><strong>Privacy reminder:</strong> Passport information is sensitive. This is a demo form that saves to this browser only. Do not enter real passport data until a secure backend is connected.</div>
      <form class="pcc-form referral-form apply-form" id="career-apply-form">
        <div class="form-grid">
          <div class="field full"><label for="applyName">Full name *</label><input id="applyName" name="candidateName" required autocomplete="name" placeholder="Name as per passport"></div>
          <div class="field full"><label for="applyCategory">Category *</label><input id="applyCategory" name="category" type="text" required maxlength="100" placeholder="e.g. Skilled worker, Driver, Helper"></div>
          <div class="field"><label for="applyDob">Date of birth *</label><input id="applyDob" name="dob" type="date" required></div>
          <div class="field"><label for="applyAge">Age (auto-calculated)</label><input id="applyAge" name="age" type="number" readonly placeholder="Calculated from date of birth"></div>
          <div class="field"><label for="applyExperience">Total experience</label><input id="applyExperience" name="experience" placeholder="e.g. 5 years construction"></div>
          <div class="field"><label for="applyAbroad">Overseas experience</label><input id="applyAbroad" name="abroadExperience" placeholder="Country, role and duration, if any"></div>
          <div class="field full"><label for="applySkills">Skills *</label><textarea id="applySkills" name="skills" rows="3" required placeholder="List key skills, trades, licences or certifications"></textarea></div>
          <div class="field full"><label for="applyEducation">Education / qualification *</label><input id="applyEducation" name="education" required placeholder="Highest education or trade qualification"></div>
          <div class="field full"><label for="applyPassport">Passport number *</label><input id="applyPassport" name="passportNumber" required autocomplete="off" placeholder="Enter passport number"></div>
          <div class="field full"><label for="applyMarital">Marital status *</label><select id="applyMarital" name="maritalStatus" required><option value="">Select status</option><option>Married</option><option>Unmarried</option></select></div>
          <div class="field full"><label>Has the candidate ever lost a passport? *</label>
            <div class="radio-row"><label class="radio-label"><input type="radio" name="lostPassport" value="Yes" required> Yes</label><label class="radio-label"><input type="radio" name="lostPassport" value="No" required> No</label></div></div>
          <div class="field full" id="applyLostField" hidden><label for="applyLostDetails">Lost passport details</label><textarea id="applyLostDetails" name="lostPassportDetails" rows="2" placeholder="If known, add approximate date, country and whether a replacement was issued"></textarea></div>
          <div class="field full"><label>Spouse passport available? *</label>
            <div class="radio-row"><label class="radio-label"><input type="radio" name="spousePassport" value="Yes" required> Yes</label><label class="radio-label"><input type="radio" name="spousePassport" value="No" required> No</label><label class="radio-label"><input type="radio" name="spousePassport" value="N/A" required> N/A</label></div></div>
          <div class="field full"><label>Parent passport available? *</label>
            <div class="radio-row"><label class="radio-label"><input type="radio" name="parentPassport" value="Yes" required> Yes</label><label class="radio-label"><input type="radio" name="parentPassport" value="No" required> No</label></div></div>
        </div>
        <div class="form-footer"><p>Submit only information you are authorised to share.</p><button class="btn btn-primary" type="submit">Submit Application →</button></div>
        <div class="form-message" id="apply-form-message" role="status"></div>
      </form>`;
    jobDrawerContent.scrollTop = 0;

    const form = jobDrawerContent.querySelector('#career-apply-form');
    const dob = form.querySelector('#applyDob');
    const age = form.querySelector('#applyAge');
    const lostField = form.querySelector('#applyLostField');
    const lostInput = form.querySelector('#applyLostDetails');
    const updateAge = () => {
      if (!dob.value) { age.value = ''; return; }
      const born = new Date(`${dob.value}T00:00:00`);
      const today = new Date();
      if (Number.isNaN(born.getTime()) || born > today) { age.value = ''; return; }
      let years = today.getFullYear() - born.getFullYear();
      const m = today.getMonth() - born.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < born.getDate())) years--;
      age.value = String(years);
    };
    const t = new Date();
    dob.max = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    dob.addEventListener('input', updateAge);
    dob.addEventListener('change', updateAge);
    const updateLost = () => {
      const selected = form.querySelector('input[name="lostPassport"]:checked')?.value;
      lostField.hidden = selected !== 'Yes';
      lostInput.required = selected === 'Yes';
      if (selected !== 'Yes') lostInput.value = '';
    };
    form.querySelectorAll('input[name="lostPassport"]').forEach(r => r.addEventListener('change', updateLost));

    form.addEventListener('submit', event => {
      event.preventDefault();
      updateAge();
      const message = form.querySelector('#apply-form-message');
      const data = Object.fromEntries(new FormData(form).entries());
      data.category = (data.category || '').trim();
      data.age = age.value || '';
      data.jobId = job.id;
      data.jobTitle = job.title;
      data.submittedAt = new Date().toISOString();
      data.id = newId();
      try {
        const entries = readList(CAREER_KEY);
        entries.unshift(data);
        saveList(CAREER_KEY, entries);
        jobDrawerContent.innerHTML = `<div class="apply-success"><div class="apply-success-icon">✓</div><h3>Application submitted</h3><p>Your application for <strong>${safe(job.title)}</strong> has been saved in this browser demo. The admin can view it under Career Enquiries when using this same browser profile.</p><button type="button" class="btn btn-outline" id="apply-back-btn">Back to job details</button></div>`;
        jobDrawerContent.scrollTop = 0;
      } catch (_) {
        if (message) { message.className = 'form-message error'; message.textContent = 'Could not save the application in browser storage.'; }
      }
    });
  };

  const openJobDrawer = card => {
    if (!jobDrawer || !jobDrawerBackdrop || !jobDrawerContent) return;
    currentJobCard = card;
    fillJobDrawer(card);
    jobDrawerBackdrop.hidden = false;
    requestAnimationFrame(() => {
      jobDrawer.classList.add('open');
      jobDrawerBackdrop.classList.add('visible');
      jobDrawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('job-drawer-open');
      jobDrawer.focus();
    });
  };
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('.view-job-btn');
    if (viewButton) {
      const card = viewButton.closest('.job-card');
      if (card) openJobDrawer(card);
    }
    if (event.target.closest('#apply-job-btn')) showApplyForm(currentJobCard);
    if (event.target.closest('#apply-back-btn') && currentJobCard) fillJobDrawer(currentJobCard);
    if (event.target.closest('#job-drawer-close') || event.target.id === 'job-drawer-backdrop') closeJobDrawer();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && jobDrawer?.classList.contains('open')) closeJobDrawer();
  });

  // General Contact Us enquiry form (local browser demo only).
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = document.getElementById('contact-form-message');
      const data = Object.fromEntries(new FormData(contactForm).entries());
      data.submittedAt = new Date().toISOString();
      data.id = newId();
      try {
        const entries = readList(CONTACT_KEY);
        entries.unshift(data);
        saveList(CONTACT_KEY, entries);
        if (message) {
          message.className = 'form-message success';
          message.textContent = 'Thank you for contacting us. Your demo enquiry has been saved in this browser only; it has not been sent to the company.';
        }
        contactForm.reset();
      } catch (_) {
        if (message) {
          message.className = 'form-message error';
          message.textContent = 'We could not save this demo enquiry in browser storage. Please try again.';
        }
      }
    });
  }

  // PCC enquiry form
  const pccForm = document.getElementById('pcc-form');
  if (pccForm) {
    pccForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = document.getElementById('form-message');
      const data = Object.fromEntries(new FormData(pccForm).entries());
      data.submittedAt = new Date().toISOString();
      data.id = newId();
      try {
        const entries = readList(PCC_KEY);
        entries.unshift(data);
        saveList(PCC_KEY, entries);
        if (message) {
          message.className = 'form-message success';
          message.textContent = 'Thank you. Your demo enquiry has been saved in this browser. A live website needs a secure backend to receive it centrally.';
        }
        pccForm.reset();
      } catch (_) {
        if (message) { message.className = 'form-message error'; message.textContent = 'Could not save this demo enquiry in browser storage.'; }
      }
    });
  }

  // Admin demo login
  const adminLogin = document.getElementById('admin-login');
  if (adminLogin) {
    adminLogin.addEventListener('submit', event => {
      event.preventDefault();
      const username = adminLogin.querySelector('[name="username"]')?.value.trim();
      const password = adminLogin.querySelector('[name="password"]')?.value;
      const error = document.getElementById('login-error');
      if (username === 'admin' && password === 'demo123') {
        sessionStorage.setItem('gulfbridge_demo_admin', 'yes');
        window.location.href = 'admin-dashboard.html';
      } else if (error) {
        error.textContent = 'Incorrect username or password. Use the demo credentials shown below.';
      }
    });
  }

  // Agent demo login
  const agentLogin = document.getElementById('agent-login');
  if (agentLogin) {
    agentLogin.addEventListener('submit', event => {
      event.preventDefault();
      const username = agentLogin.querySelector('[name="username"]')?.value.trim();
      const password = agentLogin.querySelector('[name="password"]')?.value;
      const error = document.getElementById('agent-login-error');
      if (username === 'agent' && password === 'demo123') {
        sessionStorage.setItem('gulfbridge_demo_agent', 'yes');
        window.location.href = 'agent-dashboard.html';
      } else if (error) {
        error.textContent = 'Incorrect username or password. Use the demo agent credentials shown below.';
      }
    });
  }

  // Agent referral form and automatic age calculation
  const referralForm = document.getElementById('agent-referral-form');
  if (referralForm) {
    if (sessionStorage.getItem('gulfbridge_demo_agent') !== 'yes') {
      window.location.replace('agent-login.html');
      return;
    }
    const dobInput = document.getElementById('candidateDob');
    const ageInput = document.getElementById('candidateAge');
    const lostDetailsField = document.getElementById('lost-passport-details-field');
    const lostDetailsInput = document.getElementById('lostPassportDetails');
    const updateAge = () => {
      if (!dobInput || !ageInput || !dobInput.value) { if (ageInput) ageInput.value = ''; return; }
      const dob = new Date(`${dobInput.value}T00:00:00`);
      const today = new Date();
      if (Number.isNaN(dob.getTime()) || dob > today) { ageInput.value = ''; return; }
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
      ageInput.value = String(age);
    };
    if (dobInput) {
      const today = new Date();
      dobInput.max = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      dobInput.addEventListener('input', updateAge);
      dobInput.addEventListener('change', updateAge);
    }
    const updateLostPassport = () => {
      const selected = referralForm.querySelector('input[name="lostPassport"]:checked')?.value;
      if (lostDetailsField) lostDetailsField.hidden = selected !== 'Yes';
      if (lostDetailsInput) {
        lostDetailsInput.required = selected === 'Yes';
        if (selected !== 'Yes') lostDetailsInput.value = '';
      }
    };
    referralForm.querySelectorAll('input[name="lostPassport"]').forEach(input => input.addEventListener('change', updateLostPassport));
    updateAge(); updateLostPassport();

    referralForm.addEventListener('submit', event => {
      event.preventDefault();
      updateAge();
      const message = document.getElementById('agent-form-message');
      const data = Object.fromEntries(new FormData(referralForm).entries());
      data.age = ageInput?.value || '';
      data.submittedAt = new Date().toISOString();
      data.id = newId();
      data.agent = 'agent';
      try {
        const entries = readList(AGENT_KEY);
        entries.unshift(data);
        saveList(AGENT_KEY, entries);
        if (message) {
          message.className = 'form-message success';
          message.textContent = 'Referral saved in this browser demo. The admin can view it under Agent Enquiries when using this same browser profile.';
        }
        referralForm.reset();
        if (ageInput) ageInput.value = '';
        updateLostPassport();
        if (dobInput) dobInput.focus();
      } catch (_) {
        if (message) { message.className = 'form-message error'; message.textContent = 'Could not save the referral in browser storage.'; }
      }
    });
    const agentLogout = document.getElementById('agent-logout');
    if (agentLogout) agentLogout.addEventListener('click', () => {
      sessionStorage.removeItem('gulfbridge_demo_agent');
      window.location.href = 'agent-login.html';
    });
  }

  // Admin dashboard: guard, PCC/Agent/Contact tabs, search, detail modal and CSV exports
  const pccRows = document.getElementById('enquiry-rows');
  const agentRows = document.getElementById('agent-enquiry-rows');
  if (pccRows && agentRows) {
    if (sessionStorage.getItem('gulfbridge_demo_admin') !== 'yes') {
      window.location.replace('admin-login.html');
      return;
    }
    let pccEntries = readList(PCC_KEY);
    let agentEntries = readList(AGENT_KEY);
    let contactEntries = readList(CONTACT_KEY); // ── CONTACT ──
    let careerEntries = readList(CAREER_KEY); // ── CAREER ──
    let careerJobFilter = 'all';
    const careerSearch = document.getElementById('search-career-enquiries');
    const careerEmpty = document.getElementById('career-empty-state');
    const careerRows = document.getElementById('career-enquiry-rows');
    const careerJobChips = document.getElementById('career-job-chips');
    const pccSearch = document.getElementById('search-enquiries');
    const agentSearch = document.getElementById('search-agent-enquiries');
    const contactSearch = document.getElementById('search-contact-enquiries'); // ── CONTACT ──
    const pccEmpty = document.getElementById('empty-state');
    const agentEmpty = document.getElementById('agent-empty-state');
    const contactEmpty = document.getElementById('contact-empty-state'); // ── CONTACT ──
    const contactRows = document.getElementById('contact-enquiry-rows'); // ── CONTACT ──
    const modal = document.getElementById('detail-modal');
    const detailContent = document.getElementById('detail-content');
    const detailTitle = document.getElementById('detail-title');
    const closeModal = document.getElementById('close-modal');

    const showTab = view => {
      ['pcc', 'agent', 'contact', 'career', 'jobs'].forEach(name => { // ── CONTACT ── added 'contact'
        const section = document.getElementById(`${name}-view`);
        if (section) section.hidden = name !== view;
      });
      document.querySelectorAll('.dashboard-tab').forEach(tab => {
        const active = tab.dataset.view === view;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
    };
    document.querySelectorAll('.dashboard-tab').forEach(tab => tab.addEventListener('click', () => {
      if (tab.dataset.view === 'career') { careerEntries = readList(CAREER_KEY); renderCareer(); }
      showTab(tab.dataset.view);
    }));

    const renderPcc = () => {
      const query = (pccSearch?.value || '').trim().toLowerCase();
      const filtered = pccEntries.filter(e => [e.fullName, e.whatsapp, e.country].some(v => String(v || '').toLowerCase().includes(query)));
      document.getElementById('stat-total').textContent = pccEntries.length;
      document.getElementById('stat-yes').textContent = pccEntries.filter(e => e.criminalOffence === 'Yes').length;
      document.getElementById('stat-civil').textContent = pccEntries.filter(e => e.civilId === 'Yes').length;
      pccRows.innerHTML = filtered.map(e => `<tr><td><strong>${safe(e.fullName)}</strong><small>${safe(e.whatsapp)}</small></td><td>${safe(e.country)}</td><td>${safe(formatDate(e.firstEntry))}</td><td>${safe(formatDate(e.lastExit))}</td><td><span class="status-pill ${e.criminalOffence === 'Yes' ? 'yes' : ''}">${safe(e.criminalOffence)}</span></td><td>${safe(e.civilId)}</td><td>${safe(formatDateTime(e.submittedAt))}</td><td><button class="btn btn-outline btn-small view-entry" data-kind="pcc" data-id="${safe(e.id)}">View</button></td></tr>`).join('');
      if (pccEmpty) {
        pccEmpty.classList.toggle('empty-hidden', filtered.length > 0);
        pccEmpty.querySelector('h3').textContent = pccEntries.length && !filtered.length ? 'No matching enquiries' : 'No PCC enquiries yet';
        pccEmpty.querySelector('p').textContent = pccEntries.length && !filtered.length ? 'Try a different name, country or phone number.' : "Submitted PCC enquiries will appear here in this browser's demo storage.";
      }
    };
    const renderAgent = () => {
      const query = (agentSearch?.value || '').trim().toLowerCase();
      const filtered = agentEntries.filter(e => [e.candidateName, e.skills, e.education, e.experience, e.abroadExperience, e.passportNumber].some(v => String(v || '').toLowerCase().includes(query)));
      document.getElementById('agent-stat-total').textContent = agentEntries.length;
      document.getElementById('agent-stat-married').textContent = agentEntries.filter(e => e.maritalStatus === 'Married').length;
      document.getElementById('agent-stat-abroad').textContent = agentEntries.filter(e => String(e.abroadExperience || '').trim()).length;
      agentRows.innerHTML = filtered.map(e => `<tr><td><strong>${safe(e.candidateName)}</strong><small>${safe(e.education)}</small></td><td>${safe(e.age)} / ${safe(formatDate(e.dob))}</td><td>${safe(e.experience || '—')}<small>${safe(e.abroadExperience || 'No overseas experience entered')}</small></td><td>${safe(e.maritalStatus)}</td><td>${safe(e.lostPassport)}</td><td>${safe(formatDateTime(e.submittedAt))}</td><td><button class="btn btn-outline btn-small view-entry" data-kind="agent" data-id="${safe(e.id)}">View</button></td></tr>`).join('');
      if (agentEmpty) {
        agentEmpty.classList.toggle('empty-hidden', filtered.length > 0);
        agentEmpty.querySelector('h3').textContent = agentEntries.length && !filtered.length ? 'No matching referrals' : 'No agent referrals yet';
        agentEmpty.querySelector('p').textContent = agentEntries.length && !filtered.length ? 'Try another candidate name, skill or qualification.' : "Candidate referrals submitted through the agent portal will appear here in this browser's demo storage.";
      }
    };

    // ── CONTACT ── Render contact enquiries
    const renderContact = () => {
      if (!contactRows) return;
      const query = (contactSearch?.value || '').trim().toLowerCase();
      const filtered = contactEntries.filter(e => [e.name, e.phone, e.email, e.subject, e.message].some(v => String(v || '').toLowerCase().includes(query)));
      document.getElementById('contact-stat-total').textContent = contactEntries.length;
      document.getElementById('contact-stat-jobs').textContent = contactEntries.filter(e => (e.subject || '') === 'Job opportunity').length;
      document.getElementById('contact-stat-employer').textContent = contactEntries.filter(e => (e.subject || '') === 'Employer / workforce enquiry').length;
      contactRows.innerHTML = filtered.map(e => {
        const msg = String(e.message || '');
        const preview = msg.length > 90 ? msg.slice(0, 90) + '…' : msg;
        return `<tr>
          <td><strong>${safe(e.name)}</strong><small>${safe(e.phone || e.email || '—')}</small></td>
          <td>${safe(e.subject || '—')}</td>
          <td>${safe(preview || '—')}</td>
          <td>${safe(formatDateTime(e.submittedAt))}</td>
          <td><button class="btn btn-outline btn-small view-entry" data-kind="contact" data-id="${safe(e.id)}">View</button></td>
        </tr>`;
      }).join('');
      if (contactEmpty) {
        contactEmpty.classList.toggle('empty-hidden', filtered.length > 0);
        contactEmpty.querySelector('h3').textContent = contactEntries.length && !filtered.length ? 'No matching messages' : 'No contact enquiries yet';
        contactEmpty.querySelector('p').textContent = contactEntries.length && !filtered.length ? 'Try a different name, subject, phone or email.' : "Messages sent through the Contact Us page will appear here in this browser's demo storage.";
      }
    };

    const openDetails = (kind, id) => {
      const isAgent = kind === 'agent';
      const isContact = kind === 'contact'; // ── CONTACT ──
      const isCareer = kind === 'career'; // ── CAREER ──
      const source = isAgent ? agentEntries : isContact ? contactEntries : isCareer ? careerEntries : pccEntries;
      const entry = source.find(item => String(item.id) === String(id));
      if (!entry || !modal || !detailContent) return;
      detailTitle.textContent = (isAgent || isCareer)
        ? (entry.candidateName || 'Candidate details')
        : isContact
          ? (entry.name || 'Contact enquiry details')
          : (entry.fullName || 'PCC enquiry details');
      if (isAgent) {
        detailContent.innerHTML = '<div class="detail-grid">' +
          addDetail('Candidate name', entry.candidateName) + addDetail('Date of birth', formatDate(entry.dob)) +
          addDetail('Age', entry.age) + addDetail('Total experience', entry.experience) +
          addDetail('Overseas experience', entry.abroadExperience) + addDetail('Skills', entry.skills) +
          addDetail('Education / qualification', entry.education) + addDetail('Passport number', entry.passportNumber) +
          addDetail('Marital status', entry.maritalStatus) + addDetail('Lost passport', entry.lostPassport) +
          addDetail('Lost passport details', entry.lostPassportDetails) + addDetail('Spouse passport available', entry.spousePassport) +
          addDetail('Parent passport available', entry.parentPassport) + addDetail('Submitted at', formatDateTime(entry.submittedAt)) + '</div>';
      } else if (isCareer) { // ── CAREER ──
        detailContent.innerHTML = '<div class="detail-grid">' +
          addDetail('Applied for (job)', entry.jobTitle) + addDetail('Category', entry.category) +
          addDetail('Candidate name', entry.candidateName) + addDetail('Date of birth', formatDate(entry.dob)) +
          addDetail('Age', entry.age) + addDetail('Total experience', entry.experience) +
          addDetail('Overseas experience', entry.abroadExperience) + addDetail('Skills', entry.skills) +
          addDetail('Education / qualification', entry.education) + addDetail('Passport number', entry.passportNumber) +
          addDetail('Marital status', entry.maritalStatus) + addDetail('Lost passport', entry.lostPassport) +
          addDetail('Lost passport details', entry.lostPassportDetails) + addDetail('Spouse passport available', entry.spousePassport) +
          addDetail('Parent passport available', entry.parentPassport) + addDetail('Submitted at', formatDateTime(entry.submittedAt)) + '</div>';
      } else if (isContact) { // ── CONTACT ──
        detailContent.innerHTML = '<div class="detail-grid">' +
          addDetail('Full name', entry.name) +
          addDetail('Phone', entry.phone) +
          addDetail('Email', entry.email) +
          addDetail('Enquiry type', entry.subject) +
          addDetail('Consent to contact', entry.consent) +
          addDetail('Submitted at', formatDateTime(entry.submittedAt)) +
          '</div>' +
          `<div class="detail-notes"><h4>Message</h4><p>${safe(entry.message || '—').replace(/\n/g, '<br>')}</p></div>`;
      } else {
        detailContent.innerHTML = '<div class="detail-grid">' +
          addDetail('Full name', entry.fullName) + addDetail('WhatsApp contact', entry.whatsapp) +
          addDetail('Number of passports held', entry.passportCount) + addDetail('Criminal offence abroad', entry.criminalOffence) +
          addDetail('Country applying PCC for', entry.country) + addDetail('First entry date', formatDate(entry.firstEntry)) +
          addDetail('Last exit date', formatDate(entry.lastExit)) + addDetail('Resident / civil ID card', entry.civilId) +
          addDetail('Submitted at', formatDateTime(entry.submittedAt)) + '</div>';
      }
      modal.hidden = false;
    };
    document.querySelectorAll('.dashboard-view tbody').forEach(tbody => tbody.addEventListener('click', event => {
      const button = event.target.closest('.view-entry');
      if (button) openDetails(button.dataset.kind, button.dataset.id);
    }));
    if (closeModal) closeModal.addEventListener('click', () => { modal.hidden = true; });
    if (modal) modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal) modal.hidden = true; });
    if (pccSearch) pccSearch.addEventListener('input', renderPcc);
    if (agentSearch) agentSearch.addEventListener('input', renderAgent);
    if (contactSearch) contactSearch.addEventListener('input', renderContact); // ── CONTACT ──

    const pccExport = document.getElementById('export-pcc-csv');
    if (pccExport) pccExport.addEventListener('click', () => csvDownload('pcc-enquiries-demo.csv', ['Full name','WhatsApp','Passports held','Criminal offence abroad','Country','First entry','Last exit','Civil ID','Submitted at'], ['fullName','whatsapp','passportCount','criminalOffence','country','firstEntry','lastExit','civilId','submittedAt'], pccEntries));
    const agentExport = document.getElementById('export-agent-csv');
    if (agentExport) agentExport.addEventListener('click', () => csvDownload('agent-referrals-demo.csv', ['Candidate name','DOB','Age','Experience','Overseas experience','Skills','Education','Passport number','Marital status','Lost passport','Lost passport details','Spouse passport','Parent passport','Submitted at'], ['candidateName','dob','age','experience','abroadExperience','skills','education','passportNumber','maritalStatus','lostPassport','lostPassportDetails','spousePassport','parentPassport','submittedAt'], agentEntries));

    // ── CONTACT ── CSV export for contact enquiries
    const contactExport = document.getElementById('export-contact-csv');
    if (contactExport) contactExport.addEventListener('click', () => csvDownload(
      'contact-enquiries-demo.csv',
      ['Full name','Phone','Email','Enquiry type','Message','Consent','Submitted at'],
      ['name','phone','email','subject','message','consent','submittedAt'],
      contactEntries
    ));

    // Admin job manager: title + short description + image.
    const adminJobForm = document.getElementById('admin-job-form');
    const adminJobRows = document.getElementById('admin-job-rows');
    const adminJobsEmpty = document.getElementById('admin-jobs-empty');
    const adminJobCount = document.getElementById('admin-job-count');
    const photoInput = document.getElementById('job-photo');
    const photoPreview = document.getElementById('job-photo-preview');
    let jobProfiles = readList(JOBS_KEY);
    if (photoInput && photoPreview) photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) { photoPreview.hidden = true; photoPreview.removeAttribute('src'); return; }
      if (!file.type.startsWith('image/')) { photoInput.value = ''; photoPreview.hidden = true; alert('Please select an image file.'); return; }
      if (file.size > 2 * 1024 * 1024) { photoInput.value = ''; photoPreview.hidden = true; alert('Please choose an image smaller than 2 MB.'); return; }
      const reader = new FileReader();
      reader.onload = () => { photoPreview.src = reader.result; photoPreview.hidden = false; };
      reader.readAsDataURL(file);
    });
    const renderAdminJobs = () => {
      if (!adminJobRows) return;
      adminJobRows.innerHTML = jobProfiles.map(job => `<tr>
        <td><strong>${safe(job.jobName)}</strong></td>
        <td>${job.photo ? `<img class="admin-job-thumb" src="${job.photo}" alt="${safe(job.jobName)}">` : '—'}</td>
        <td>${safe(job.description || job.responsibilities || '—').slice(0, 150)}</td>
        <td><button type="button" class="btn btn-outline btn-small delete-job" data-id="${safe(job.id)}">Delete</button></td>
      </tr>`).join('');
      if (adminJobCount) adminJobCount.textContent = `${jobProfiles.length} ${jobProfiles.length === 1 ? 'job' : 'jobs'}`;
      if (adminJobsEmpty) adminJobsEmpty.classList.toggle('empty-hidden', jobProfiles.length > 0);
    };
    if (adminJobForm) adminJobForm.addEventListener('submit', event => {
      event.preventDefault();
      const message = document.getElementById('job-form-message');
      const file = photoInput?.files?.[0];
      if (!file) { if (message) { message.className = 'form-message error'; message.textContent = 'Please choose a job photo.'; } return; }
      if (file.size > 2 * 1024 * 1024 || !file.type.startsWith('image/')) { if (message) { message.className = 'form-message error'; message.textContent = 'Choose a valid image smaller than 2 MB.'; } return; }
      const reader = new FileReader();
      reader.onload = () => {
        const data = { jobName: adminJobForm.elements.jobName.value.trim(), description: adminJobForm.elements.description.value.trim(), photo: reader.result, submittedAt: new Date().toISOString(), id: newId() };
        try {
          jobProfiles.unshift(data);
          saveList(JOBS_KEY, jobProfiles);
          renderAdminJobs(); renderPublicJobs(); renderAgentJobs();
          if (message) { message.className = 'form-message success'; message.textContent = 'Job published. It is now listed on the Careers page and in the agent dashboard.'; }
          adminJobForm.reset(); if (photoPreview) { photoPreview.hidden = true; photoPreview.removeAttribute('src'); }
        } catch (_) {
          jobProfiles = readList(JOBS_KEY);
          if (message) { message.className = 'form-message error'; message.textContent = 'Could not save this image/job. Try a smaller image or clear some browser storage.'; }
        }
      };
      reader.onerror = () => { if (message) { message.className = 'form-message error'; message.textContent = 'Could not read the selected image.'; } };
      reader.readAsDataURL(file);
    });
    if (adminJobRows) adminJobRows.addEventListener('click', event => {
      const button = event.target.closest('.delete-job');
      if (!button) return;
      jobProfiles = jobProfiles.filter(job => String(job.id) !== String(button.dataset.id));
      try { saveList(JOBS_KEY, jobProfiles); renderAdminJobs(); renderPublicJobs(); renderAgentJobs(); }
      catch (_) { alert('Could not update job profiles in browser storage.'); }
    });
    renderAdminJobs();

    // ── CAREER ── Career enquiries: applications submitted from the Careers page, grouped by job
    const careerKeyOf = e => String(e.jobId || e.jobTitle || '');
    const renderCareer = () => {
      if (!careerRows) return;
      const jobs = new Map();
      readList(JOBS_KEY).forEach(job => jobs.set(String(job.id), { title: job.jobName, count: 0 }));
      careerEntries.forEach(e => {
        const key = careerKeyOf(e);
        const item = jobs.get(key) || { title: e.jobTitle || 'Unknown job', count: 0 };
        item.count++;
        jobs.set(key, item);
      });
      if (careerJobFilter !== 'all' && !jobs.has(careerJobFilter)) careerJobFilter = 'all';
      if (careerJobChips) {
        const chips = [...jobs.entries()].sort((a, b) => b[1].count - a[1].count || String(a[1].title).localeCompare(String(b[1].title)));
        careerJobChips.innerHTML = `<button type="button" class="job-chip ${careerJobFilter === 'all' ? 'active' : ''}" data-job-key="all">All jobs <span>${careerEntries.length}</span></button>` +
          chips.map(([key, item]) => `<button type="button" class="job-chip ${careerJobFilter === key ? 'active' : ''}" data-job-key="${safe(key)}">${safe(item.title)} <span>${item.count}</span></button>`).join('');
      }
      const query = (careerSearch?.value || '').trim().toLowerCase();
      const filtered = careerEntries.filter(e =>
        (careerJobFilter === 'all' || careerKeyOf(e) === careerJobFilter) &&
        [e.candidateName, e.jobTitle, e.category, e.skills, e.education, e.passportNumber].some(v => String(v || '').toLowerCase().includes(query)));
      const topJob = [...jobs.values()].sort((a, b) => b.count - a.count)[0];
      document.getElementById('career-stat-total').textContent = careerEntries.length;
      document.getElementById('career-stat-jobs').textContent = [...jobs.values()].filter(j => j.count > 0).length;
      document.getElementById('career-stat-top').textContent = topJob && topJob.count > 0 ? topJob.title : '—';
      const heading = document.getElementById('career-table-title');
      if (heading) heading.textContent = careerJobFilter === 'all' ? 'All job applications' : `Applications for ${jobs.get(careerJobFilter)?.title || 'job'}`;
      careerRows.innerHTML = filtered.map(e => `<tr><td><strong>${safe(e.candidateName)}</strong><small>${safe(e.education)}</small></td><td>${safe(e.jobTitle || '—')}</td><td>${safe(e.category || '—')}</td><td>${safe(e.age)} / ${safe(formatDate(e.dob))}</td><td>${safe(e.experience || '—')}<small>${safe(e.abroadExperience || 'No overseas experience entered')}</small></td><td>${safe(e.maritalStatus)}</td><td>${safe(formatDateTime(e.submittedAt))}</td><td><button class="btn btn-outline btn-small view-entry" data-kind="career" data-id="${safe(e.id)}">View</button></td></tr>`).join('');
      if (careerEmpty) {
        careerEmpty.classList.toggle('empty-hidden', filtered.length > 0);
        careerEmpty.querySelector('h3').textContent = careerEntries.length && !filtered.length ? 'No matching applications' : 'No career applications yet';
        careerEmpty.querySelector('p').textContent = careerEntries.length && !filtered.length ? 'Try another job, candidate name or category.' : "Applications submitted from the Careers page will appear here in this browser's demo storage.";
      }
    };
    if (careerSearch) careerSearch.addEventListener('input', renderCareer);
    if (careerJobChips) careerJobChips.addEventListener('click', event => {
      const chip = event.target.closest('.job-chip');
      if (!chip) return;
      careerJobFilter = chip.dataset.jobKey;
      renderCareer();
    });
    const careerExport = document.getElementById('export-career-csv');
    if (careerExport) careerExport.addEventListener('click', () => csvDownload(
      'career-applications-demo.csv',
      ['Job applied for','Category','Candidate name','DOB','Age','Experience','Overseas experience','Skills','Education','Passport number','Marital status','Lost passport','Lost passport details','Spouse passport','Parent passport','Submitted at'],
      ['jobTitle','category','candidateName','dob','age','experience','abroadExperience','skills','education','passportNumber','maritalStatus','lostPassport','lostPassportDetails','spousePassport','parentPassport','submittedAt'],
      careerJobFilter === 'all' ? careerEntries : careerEntries.filter(e => careerKeyOf(e) === careerJobFilter)
    ));

    const logout = document.getElementById('logout');
    if (logout) logout.addEventListener('click', () => { sessionStorage.removeItem('gulfbridge_demo_admin'); window.location.href = 'admin-login.html'; });

    renderPcc(); renderAgent(); renderContact(); renderCareer(); showTab('pcc'); // ── CONTACT ── added renderContact()
  }
});