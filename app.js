/**
 * GRIYA RUMPUT TAMAN - MODERN APPLICATION & ADMIN CMS ENGINE
 * Features:
 * 1. Admin Authentication & Visual In-Place CMS Editor (contenteditable)
 * 2. Real-Time Price & Contact Settings Manager
 * 3. Export Standalone HTML with changes baked in
 * 4. Dual Theme Engine (Dark / Light Mode)
 * 5. Interactive Lawn Turf Calculator & Cost Estimator
 * 6. Catalog Filtering & WhatsApp Dynamic Order Generator
 * 7. FAQ Accordion & Mobile Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================================
  // DEFAULT CONFIGURATION & CMS DATA
  // ========================================================
  const DEFAULT_CONFIG = {
    prices: {
      gajah_mini: 25000,
      jepang: 35000,
      golf: 45000,
      swiss: 40000,
      manila: 32000
    },
    rates: {
      install: 15000,
      fert: 10000
    },
    contact: {
      wa_number: '6281234567890',
      phone_display: '0812-3456-7890',
      address: 'Jl. Raya Pertamanan Hijau No. 88'
    },
    texts: {} // will store custom text overrides for [data-cms] elements
  };

  // Load CMS Data from localStorage or initialize with default
  let cmsData = JSON.parse(localStorage.getItem('griya_cms_data')) || JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  // Ensure structure integrity
  if (!cmsData.prices) cmsData.prices = { ...DEFAULT_CONFIG.prices };
  if (!cmsData.rates) cmsData.rates = { ...DEFAULT_CONFIG.rates };
  if (!cmsData.contact) cmsData.contact = { ...DEFAULT_CONFIG.contact };
  if (!cmsData.texts) cmsData.texts = {};

  // Grass names lookup
  const grassNames = {
    gajah_mini: 'Rumput Gajah Mini',
    jepang: 'Rumput Jepang / Peking',
    golf: 'Rumput Golf / Bermuda',
    swiss: 'Rumput Swiss Super',
    manila: 'Rumput Manila'
  };

  // Toast Notification Helper
  const adminToast = document.getElementById('adminToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimer = null;

  function showToast(msg, icon = '✅') {
    if (!adminToast) return;
    toastMessage.textContent = msg;
    const iconEl = adminToast.querySelector('.toast-icon');
    if (iconEl) iconEl.textContent = icon;
    adminToast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      adminToast.classList.add('hidden');
    }, 3200);
  }

  function formatIDR(amount) {
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
  }

  // ========================================================
  // 1. THEME ENGINE (DARK / LIGHT MODE)
  // ========================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const root = document.documentElement;

  const savedTheme = localStorage.getItem('griya_theme') || 'dark';
  applyTheme(savedTheme);

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('griya_theme', theme);
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'Mode Gelap' : 'Mode Terang';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = root.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  // ========================================================
  // 2. ADMIN AUTHENTICATION & CMS ENGINE
  // ========================================================
  const ADMIN_PIN = 'admin123';
  let isAdminLoggedIn = sessionStorage.getItem('griya_admin_auth') === 'true';
  let isLiveEditActive = false;

  const adminToolbar = document.getElementById('adminToolbar');
  const btnOpenLoginModal = document.getElementById('btnOpenLoginModal');
  const btnFooterAdmin = document.getElementById('btnFooterAdmin');
  const modalAdminLogin = document.getElementById('modalAdminLogin');
  const formAdminLogin = document.getElementById('formAdminLogin');
  const inputAdminPin = document.getElementById('inputAdminPin');
  const loginErrorMessage = document.getElementById('loginErrorMessage');
  const btnCloseLoginModal = document.getElementById('btnCloseLoginModal');
  const btnCancelLogin = document.getElementById('btnCancelLogin');

  const btnToggleLiveEdit = document.getElementById('btnToggleLiveEdit');
  const btnOpenPriceModal = document.getElementById('btnOpenPriceModal');
  const btnSaveCms = document.getElementById('btnSaveCms');
  const btnResetCms = document.getElementById('btnResetCms');
  const btnExportHtml = document.getElementById('btnExportHtml');
  const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

  // Modals & Forms
  const modalPriceSettings = document.getElementById('modalPriceSettings');
  const formPriceSettings = document.getElementById('formPriceSettings');
  const btnClosePriceModal = document.getElementById('btnClosePriceModal');
  const btnCancelPriceModal = document.getElementById('btnCancelPriceModal');

  // Open/Close Login Modal
  function openLoginModal() {
    if (isAdminLoggedIn) {
      showToast('Anda sudah masuk dalam Mode Admin!', 'ℹ️');
      return;
    }
    modalAdminLogin.classList.remove('hidden');
    loginErrorMessage.classList.add('hidden');
    inputAdminPin.value = '';
    setTimeout(() => inputAdminPin.focus(), 100);
  }

  function closeLoginModal() {
    modalAdminLogin.classList.add('hidden');
  }

  if (btnOpenLoginModal) btnOpenLoginModal.addEventListener('click', openLoginModal);
  if (btnFooterAdmin) btnFooterAdmin.addEventListener('click', openLoginModal);
  if (btnCloseLoginModal) btnCloseLoginModal.addEventListener('click', closeLoginModal);
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLoginModal);

  // Keyboard Shortcut: Cmd/Ctrl + Shift + A
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      if (!isAdminLoggedIn) {
        openLoginModal();
      } else {
        toggleLiveEdit();
      }
    }
  });

  // Handle Login
  if (formAdminLogin) {
    formAdminLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = inputAdminPin.value.trim();
      if (enteredPin === ADMIN_PIN) {
        isAdminLoggedIn = true;
        sessionStorage.setItem('griya_admin_auth', 'true');
        closeLoginModal();
        initAdminState();
        showToast('Login berhasil! Mode Admin aktif.');
      } else {
        loginErrorMessage.classList.remove('hidden');
      }
    });
  }

  // Handle Logout
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      isAdminLoggedIn = false;
      sessionStorage.removeItem('griya_admin_auth');
      setLiveEditState(false);
      adminToolbar.classList.add('hidden');
      document.body.classList.remove('admin-active');
      showToast('Keluar dari Mode Admin.', '👋');
    });
  }

  // Initialize Admin State
  function initAdminState() {
    if (!isAdminLoggedIn) {
      adminToolbar.classList.add('hidden');
      document.body.classList.remove('admin-active');
      return;
    }
    adminToolbar.classList.remove('hidden');
    document.body.classList.add('admin-active');
    setLiveEditState(true);
  }

  // Live In-Place Edit Toggle
  function setLiveEditState(active) {
    isLiveEditActive = active;
    const cmsElements = document.querySelectorAll('[data-cms]');
    if (active) {
      document.body.classList.add('cms-edit-active');
      if (btnToggleLiveEdit) btnToggleLiveEdit.classList.add('active');
      cmsElements.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('title', 'Klik untuk mengedit teks ini langsung');
      });
    } else {
      document.body.classList.remove('cms-edit-active');
      if (btnToggleLiveEdit) btnToggleLiveEdit.classList.remove('active');
      cmsElements.forEach(el => {
        el.removeAttribute('contenteditable');
        el.removeAttribute('title');
      });
    }
  }

  function toggleLiveEdit() {
    setLiveEditState(!isLiveEditActive);
    showToast(isLiveEditActive ? 'Edit Teks Langsung Aktif: Klik teks mana saja!' : 'Edit Teks Dinonaktifkan.', '✏️');
  }

  if (btnToggleLiveEdit) {
    btnToggleLiveEdit.addEventListener('click', toggleLiveEdit);
  }

  // Capture In-Place Text Edits
  document.addEventListener('input', (e) => {
    const target = e.target.closest('[data-cms]');
    if (target && isLiveEditActive) {
      const key = target.getAttribute('data-cms');
      cmsData.texts[key] = target.innerHTML;
    }
  });

  // Apply stored texts to DOM
  function applyStoredTexts() {
    if (!cmsData.texts) return;
    Object.keys(cmsData.texts).forEach(key => {
      const el = document.querySelector(`[data-cms="${key}"]`);
      if (el) {
        el.innerHTML = cmsData.texts[key];
      }
    });
  }

  // ========================================================
  // 3. PRICE & CONTACT SETTINGS MODAL
  // ========================================================
  function openPriceModal() {
    modalPriceSettings.classList.remove('hidden');
    // Prepopulate inputs with current cmsData
    document.getElementById('cfg_price_gajah_mini').value = cmsData.prices.gajah_mini;
    document.getElementById('cfg_price_jepang').value = cmsData.prices.jepang;
    document.getElementById('cfg_price_golf').value = cmsData.prices.golf;
    document.getElementById('cfg_price_swiss').value = cmsData.prices.swiss;
    document.getElementById('cfg_price_manila').value = cmsData.prices.manila;

    document.getElementById('cfg_price_install').value = cmsData.rates.install;
    document.getElementById('cfg_price_fert').value = cmsData.rates.fert;

    document.getElementById('cfg_wa_number').value = cmsData.contact.wa_number;
    document.getElementById('cfg_phone_display').value = cmsData.contact.phone_display;
  }

  function closePriceModal() {
    modalPriceSettings.classList.add('hidden');
  }

  if (btnOpenPriceModal) btnOpenPriceModal.addEventListener('click', openPriceModal);
  if (btnClosePriceModal) btnClosePriceModal.addEventListener('click', closePriceModal);
  if (btnCancelPriceModal) btnCancelPriceModal.addEventListener('click', closePriceModal);

  // Submit Price & Contact Changes
  if (formPriceSettings) {
    formPriceSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      cmsData.prices.gajah_mini = parseFloat(document.getElementById('cfg_price_gajah_mini').value) || 25000;
      cmsData.prices.jepang = parseFloat(document.getElementById('cfg_price_jepang').value) || 35000;
      cmsData.prices.golf = parseFloat(document.getElementById('cfg_price_golf').value) || 45000;
      cmsData.prices.swiss = parseFloat(document.getElementById('cfg_price_swiss').value) || 40000;
      cmsData.prices.manila = parseFloat(document.getElementById('cfg_price_manila').value) || 32000;

      cmsData.rates.install = parseFloat(document.getElementById('cfg_price_install').value) || 15000;
      cmsData.rates.fert = parseFloat(document.getElementById('cfg_price_fert').value) || 10000;

      cmsData.contact.wa_number = document.getElementById('cfg_wa_number').value.replace(/[^0-9]/g, '') || '6281234567890';
      cmsData.contact.phone_display = document.getElementById('cfg_phone_display').value.trim() || '0812-3456-7890';

      saveCmsData();
      closePriceModal();
      applyAllConfigUpdates();
      showToast('Harga dan Kontak baru berhasil diterapkan!');
    });
  }

  // Save CMS Data to LocalStorage
  function saveCmsData() {
    localStorage.setItem('griya_cms_data', JSON.stringify(cmsData));
  }

  if (btnSaveCms) {
    btnSaveCms.addEventListener('click', () => {
      saveCmsData();
      showToast('Semua teks & perubahan harga berhasil disimpan!');
    });
  }

  // Reset CMS Data
  if (btnResetCms) {
    btnResetCms.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin mengembalikan seluruh teks, harga, dan pengaturan ke setelan awal pabrik?')) {
        localStorage.removeItem('griya_cms_data');
        cmsData = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        location.reload();
      }
    });
  }

  // Export HTML with Current State
  if (btnExportHtml) {
    btnExportHtml.addEventListener('click', () => {
      // Temporarily remove editable attributes for clean export
      setLiveEditState(false);

      const cloneDoc = document.documentElement.cloneNode(true);
      // Remove admin toolbar from export clone
      const toolbarInClone = cloneDoc.querySelector('#adminToolbar');
      if (toolbarInClone) toolbarInClone.remove();
      const loginModalInClone = cloneDoc.querySelector('#modalAdminLogin');
      if (loginModalInClone) loginModalInClone.remove();
      const priceModalInClone = cloneDoc.querySelector('#modalPriceSettings');
      if (priceModalInClone) priceModalInClone.remove();
      const toastInClone = cloneDoc.querySelector('#adminToast');
      if (toastInClone) toastInClone.remove();

      cloneDoc.querySelector('body').classList.remove('admin-active', 'cms-edit-active');

      const htmlContent = '<!DOCTYPE html>\n' + cloneDoc.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index-updated.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Re-enable if was active
      setLiveEditState(true);
      showToast('File index-updated.html berhasil diunduh!');
    });
  }

  // ========================================================
  // 4. SYNCHRONIZE CONFIG WITH DOM & CALCULATOR
  // ========================================================
  function applyAllConfigUpdates() {
    // 1. Update Catalog Price Displays
    Object.keys(cmsData.prices).forEach(key => {
      const priceEl = document.getElementById(`display_price_${key}`);
      if (priceEl) {
        priceEl.textContent = formatIDR(cmsData.prices[key]);
      }
    });

    // 2. Update Addon Rate Badges
    const addonInstallRateDisplay = document.getElementById('addonInstallRateDisplay');
    if (addonInstallRateDisplay) {
      addonInstallRateDisplay.textContent = `+${formatIDR(cmsData.rates.install)}/m²`;
    }
    const addonFertRateDisplay = document.getElementById('addonFertRateDisplay');
    if (addonFertRateDisplay) {
      addonFertRateDisplay.textContent = `+${formatIDR(cmsData.rates.fert)}/m²`;
    }

    // 3. Update Calculator Select Options
    const selectOptions = document.querySelectorAll('#grassTypeSelect option');
    selectOptions.forEach(opt => {
      const val = opt.value;
      if (cmsData.prices[val]) {
        opt.setAttribute('data-price', cmsData.prices[val]);
        opt.textContent = `${grassNames[val]} — ${formatIDR(cmsData.prices[val])} / m²`;
      }
    });

    // 4. Update Contact & WhatsApp Links
    const waNumber = cmsData.contact.wa_number;
    const phoneDisplay = cmsData.contact.phone_display;

    // Update Phone Texts
    const phoneDisplayEl = document.getElementById('phoneDisplay');
    if (phoneDisplayEl) phoneDisplayEl.textContent = `📞 Telepon: ${phoneDisplay}`;
    const footerPhone = document.getElementById('footerPhone');
    if (footerPhone) footerPhone.textContent = `📞 Telepon: +${phoneDisplay}`;
    const footerWa = document.getElementById('footerWa');
    if (footerWa) footerWa.textContent = `💬 WhatsApp: ${phoneDisplay}`;

    // Update phone links
    document.querySelectorAll('.phone-dynamic-link').forEach(link => {
      link.href = `tel:${waNumber}`;
    });

    // Recalculate
    updateCalculation();
  }

  // ========================================================
  // 5. LAWN CALCULATOR & SLIDER ENGINE
  // ========================================================
  const grassTypeSelect = document.getElementById('grassTypeSelect');
  const btnModeArea = document.getElementById('btnModeArea');
  const btnModeDimension = document.getElementById('btnModeDimension');
  const groupArea = document.getElementById('groupArea');
  const groupDimension = document.getElementById('groupDimension');
  
  const rangeAreaSlider = document.getElementById('rangeAreaSlider');
  const sliderValDisplay = document.getElementById('sliderValDisplay');
  const inputArea = document.getElementById('inputArea');
  const inputLength = document.getElementById('inputLength');
  const inputWidth = document.getElementById('inputWidth');
  
  const checkInstallation = document.getElementById('checkInstallation');
  const checkFertilizer = document.getElementById('checkFertilizer');
  const checkExtraSpare = document.getElementById('checkExtraSpare');

  // Result Elements
  const resArea = document.getElementById('resArea');
  const resTotalGrass = document.getElementById('resTotalGrass');
  const resGrassName = document.getElementById('resGrassName');
  const resGrassPrice = document.getElementById('resGrassPrice');
  const resInstallPrice = document.getElementById('resInstallPrice');
  const resFertilizerPrice = document.getElementById('resFertilizerPrice');
  const resTotalPrice = document.getElementById('resTotalPrice');
  const btnOrderWhatsApp = document.getElementById('btnOrderWhatsApp');

  const SPARE_RATIO = 0.05;
  let currentMode = 'area';

  function updateCalculation() {
    let effectiveArea = 0;

    if (currentMode === 'area') {
      effectiveArea = parseFloat(inputArea.value) || 0;
    } else {
      const len = parseFloat(inputLength.value) || 0;
      const wid = parseFloat(inputWidth.value) || 0;
      effectiveArea = len * wid;
    }

    if (effectiveArea < 0) effectiveArea = 0;

    // Grass Selection
    const selectedKey = grassTypeSelect.value;
    const grassName = grassNames[selectedKey] || 'Rumput Taman';
    const grassPricePerM2 = cmsData.prices[selectedKey] || 25000;

    // Spare & Quantities
    const hasSpare = checkExtraSpare.checked;
    const totalGrassM2 = hasSpare ? (effectiveArea * (1 + SPARE_RATIO)) : effectiveArea;
    const grassPriceTotal = totalGrassM2 * grassPricePerM2;

    // Addons with dynamic CMS rates
    const installPriceTotal = checkInstallation.checked ? (effectiveArea * cmsData.rates.install) : 0;
    const fertPriceTotal = checkFertilizer.checked ? (effectiveArea * cmsData.rates.fert) : 0;

    // Grand Total
    const grandTotal = grassPriceTotal + installPriceTotal + fertPriceTotal;

    // UI Updates
    resArea.textContent = `${effectiveArea.toFixed(1)} m²`;
    const roundedLempeng = Math.ceil(totalGrassM2);
    resTotalGrass.textContent = `${totalGrassM2.toFixed(1)} m² (± ${roundedLempeng} Lempeng)`;
    resGrassName.textContent = grassName;
    resGrassPrice.textContent = formatIDR(grassPriceTotal);
    resInstallPrice.textContent = checkInstallation.checked ? formatIDR(installPriceTotal) : 'Tidak termasuk';
    resFertilizerPrice.textContent = checkFertilizer.checked ? formatIDR(fertPriceTotal) : 'Tidak termasuk';
    resTotalPrice.textContent = formatIDR(grandTotal);

    // WhatsApp Message URL with dynamic WhatsApp Number
    const waNumber = cmsData.contact.wa_number;
    const waText = `Halo GriyaRumput.id, saya ingin konsultasi pemesanan rumput:
- Varietas: *${grassName}*
- Luas Lahan: *${effectiveArea.toFixed(1)} m²*
- Kebutuhan Rumput: *${totalGrassM2.toFixed(1)} m² (± ${roundedLempeng} Lempeng)*
- Jasa Tanam: *${checkInstallation.checked ? 'Ya (Termasuk)' : 'Tidak'}*
- Tanah Merah & Pupuk: *${checkFertilizer.checked ? 'Ya (Termasuk)' : 'Tidak'}*
- Estimasi Investasi: *${formatIDR(grandTotal)}*

Mohon info ketersediaan stok panen dan jadwal pengiriman/pemasangan ke lokasi saya. Terima kasih!`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;
    btnOrderWhatsApp.onclick = () => {
      window.open(waUrl, '_blank');
    };

    // Update generic whatsapp buttons
    document.querySelectorAll('.wa-dynamic-link').forEach(link => {
      if (link !== btnOrderWhatsApp) {
        link.href = `https://wa.me/${waNumber}?text=${encodeURIComponent('Halo GriyaRumput, saya ingin konsultasi pemesanan rumput taman.')}`;
      }
    });
  }

  // Sync Slider <-> Number Input
  if (rangeAreaSlider && inputArea) {
    rangeAreaSlider.addEventListener('input', () => {
      inputArea.value = rangeAreaSlider.value;
      if (sliderValDisplay) sliderValDisplay.textContent = `${rangeAreaSlider.value} m²`;
      updateCalculation();
    });

    inputArea.addEventListener('input', () => {
      const val = parseFloat(inputArea.value) || 0;
      if (val >= parseFloat(rangeAreaSlider.min) && val <= parseFloat(rangeAreaSlider.max)) {
        rangeAreaSlider.value = val;
      }
      if (sliderValDisplay) sliderValDisplay.textContent = `${val} m²`;
      updateCalculation();
    });
  }

  // Switch Input Mode
  btnModeArea.addEventListener('click', () => {
    currentMode = 'area';
    btnModeArea.classList.add('active');
    btnModeDimension.classList.remove('active');
    groupArea.classList.remove('hidden');
    groupDimension.classList.add('hidden');
    updateCalculation();
  });

  btnModeDimension.addEventListener('click', () => {
    currentMode = 'dimension';
    btnModeDimension.classList.add('active');
    btnModeArea.classList.remove('active');
    groupDimension.classList.remove('hidden');
    groupArea.classList.add('hidden');
    updateCalculation();
  });

  // Watchers for inputs
  [grassTypeSelect, inputLength, inputWidth, checkInstallation, checkFertilizer, checkExtraSpare].forEach(el => {
    if (el) {
      el.addEventListener('input', updateCalculation);
      el.addEventListener('change', updateCalculation);
    }
  });

  // Connect Catalog "Pilih di Kalkulator"
  document.querySelectorAll('.select-grass-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const grassVal = e.target.getAttribute('data-value');
      if (grassVal && grassTypeSelect) {
        grassTypeSelect.value = grassVal;
        updateCalculation();

        const calcSection = document.getElementById('kalkulator');
        if (calcSection) {
          calcSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // ========================================================
  // 6. CATALOG FILTER CHIPS
  // ========================================================
  const filterChips = document.querySelectorAll('.filter-chip');
  const grassCards = document.querySelectorAll('.grass-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterVal = chip.getAttribute('data-filter');
      grassCards.forEach(card => {
        const categories = card.getAttribute('data-category') || '';
        if (filterVal === 'all' || categories.includes(filterVal)) {
          card.style.display = 'flex';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ========================================================
  // 7. FAQ ACCORDION
  // ========================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', (e) => {
      // Don't accordion toggle if user is editing text in CMS mode
      if (isLiveEditActive && e.target.hasAttribute('data-cms')) return;

      const isActive = item.classList.contains('active');
      faqItems.forEach(otherItem => otherItem.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ========================================================
  // 8. MOBILE MENU TOGGLE
  // ========================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('show');
      mobileMenuBtn.classList.toggle('active', isOpen);
    });

    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
        mobileMenuBtn.classList.remove('active');
      });
    });

    // Close when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target) && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        mobileMenuBtn.classList.remove('active');
      }
    });
  }

  // ========================================================
  // INITIAL BOOTSTRAP
  // ========================================================
  applyStoredTexts();
  applyAllConfigUpdates();
  initAdminState();
});
