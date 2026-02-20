/* ============================================================
   PRABUTO GAMING CAFE — Main JavaScript
   ============================================================ */

import { db, doc, getDoc, collection, addDoc, query, where, getDocs } from './firebase.js';

// ——— HELPER: Read config from Firestore with fallback ———
async function fetchConfig(key, fallback) {
  try {
    const docRef = doc(db, 'config', key);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().value : fallback;
  } catch (err) {
    console.error("Error fetching config:", err);
    return fallback;
  }
}

// ——— DEFAULT DATA (fallbacks) ———
const DEFAULT_GAMES = {
  '4players': ['FC 26', 'eFootball', 'Rocket League', 'Stumble Guys'],
  '2players': ['WWE', 'Mortal Kombat 1', 'Mortal Kombat 11', 'A Way Out', 'Overcooked', 'Split Fiction'],
  '1player': [
    'Uncharted Collection', 'GTA 5', 'God of War', 'God of War: Ragnarök',
    'Far Cry Collection', "Tom Clancy's Collection", 'Spider-Man',
    'Spider-Man: Miles Morales', 'Cyberpunk 2077', 'Resident Evil Collection', 'Outlast'
  ]
};

const DEFAULT_PRICING = { 1: 120, 2: 160, 3: 200, 4: 240 };

const DEFAULT_HOURS = [
  { day: 'Monday', open: '10:00', close: '23:30' },
  { day: 'Tuesday', open: '10:00', close: '23:00' },
  { day: 'Wednesday', open: '10:00', close: '23:00' },
  { day: 'Thursday', open: '10:00', close: '23:00' },
  { day: 'Friday', open: '10:00', close: '23:00' },
  { day: 'Saturday', open: '10:00', close: '23:00' },
  { day: 'Sunday', open: '10:00', close: '23:00' }
];

const GAME_COLORS = {
  '4players': '#00e5ff',
  '2players': '#ff2d9b',
  '1player': '#b026ff'
};

// ——— DOM READY ———
document.addEventListener('DOMContentLoaded', async () => {
  // Preloader removal
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    if (preloader) {
      setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => preloader.remove(), 800);
      }, 500);
    }
  });

  // Fallback: remove preloader after 5 seconds if load event fails
  setTimeout(() => {
    if (preloader && !preloader.classList.contains('fade-out')) {
      preloader.classList.add('fade-out');
      setTimeout(() => preloader.remove(), 800);
    }
  }, 5000);

  // 1. Initialize UI-critical components first (Non-async)
  try {
    initNavbar();
    initParticles();
    initScrollReveal();
    initSmoothScroll();
    initGamesTabs();
    initCustomCursor();
  } catch (err) {
    console.error("UI Init Error:", err);
  }

  // 2. Initialize Data-dependent components (Async)
  try {
    await initBookingForm();
    await initHoursTable();
  } catch (err) {
    console.error("Data Init Error:", err);
  }
});

// ============================================================
// NAVBAR
// ============================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const links = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveNav();
  });

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });
}

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 120;

  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-link[href="#${id}"]`);

    if (link) {
      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
}

// ============================================================
// CUSTOM CURSOR
// ============================================================
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  const glow = document.getElementById('cursorGlow');

  if (!cursor || !glow || window.innerWidth <= 1024) return;

  let mouseX = 0;
  let mouseY = 0;
  let glowX = 0;
  let glowY = 0;

  // Track mouse position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Immediate dot movement
    cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  // Smooth lag for the glow ring using requestAnimationFrame
  function animate() {
    let dx = mouseX - glowX;
    let dy = mouseY - glowY;

    glowX += dx * 0.15;
    glowY += dy * 0.15;

    glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;

    requestAnimationFrame(animate);
  }
  animate();

  // Hover effects for all interactive elements
  const hoverables = 'a, button, .tab-btn, select, input, .game-card, .price-card, .nav-logo';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) {
      cursor.classList.add('hover');
      glow.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) {
      cursor.classList.remove('hover');
      glow.classList.remove('hover');
    }
  });
}

// ============================================================
// HERO PARTICLES
// ============================================================
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const colors = ['#b026ff', '#ff2d9b', '#00e5ff', '#ffffff'];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = particle.style.height = (Math.random() * 4 + 1) + 'px';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 6px ${particle.style.background}`;
    particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
    particle.style.animationDelay = (Math.random() * 6) + 's';
    container.appendChild(particle);
  }
}

// ============================================================
// GAMES TABS
// ============================================================
async function initGamesTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Load games from Firestore
  const allGames = await fetchConfig('games', DEFAULT_GAMES);

  const renderGames = (tab) => {
    const grid = document.getElementById('gamesGrid');
    const gamesList = allGames[tab] || [];
    const color = GAME_COLORS[tab] || '#b026ff';

    if (!grid) return;

    // Fade out
    grid.style.opacity = '0';
    grid.style.transform = 'translateY(10px)';

    setTimeout(() => {
      grid.innerHTML = gamesList.map((game, i) => `
        <div class="game-card" 
             style="--card-glow-color: ${color}20; --card-border-color: ${color}; animation-delay: ${i * 0.06}s;">
          <div class="game-card-icon">🎮</div>
          <div class="game-card-title">${game}</div>
        </div>
      `).join('');

      requestAnimationFrame(() => {
        grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
      });
    }, 200);
  };

  // Initial render
  renderGames('4players');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGames(btn.dataset.tab);
    });
  });
}

// ============================================================
// BOOKING FORM
// ============================================================
async function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const playersSelect = document.getElementById('bookPlayers');
  const durationSelect = document.getElementById('bookDuration');
  const totalDisplay = document.getElementById('totalAmount');
  const bookingSection = document.getElementById('booking');
  const dateInput = document.getElementById('bookDate');
  const timeSelect = document.getElementById('bookTime');

  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }

  // Check if booking is enabled
  const bookingEnabled = await fetchConfig('booking_enabled', true);
  if (!bookingEnabled && bookingSection) {
    const formWrapper = bookingSection.querySelector('.booking-form-wrapper') || form.parentElement;
    const closedMsg = document.createElement('div');
    closedMsg.className = 'booking-closed-msg';
    closedMsg.innerHTML = `
      <div class="closed-icon">🔒</div>
      <h3>Bookings Are Currently Closed</h3>
      <p>Please check back later or contact us via WhatsApp.</p>
    `;
    formWrapper.style.position = 'relative';
    formWrapper.classList.add('closed');
    form.style.display = 'none';
    formWrapper.appendChild(closedMsg);
    return;
  }

  // Fetch initial data
  const pricing = await fetchConfig('pricing', DEFAULT_PRICING);
  const settings = await fetchConfig('settings', { whatsapp: '919790513631' });

  // Store original time options once to prevent loss during re-renders
  const masterTimeOptions = Array.from(timeSelect.options).map(opt => ({
    value: opt.value,
    text: opt.text.replace(' (Booked)', ''),
    disabled: opt.disabled && opt.value !== "",
    style: opt.getAttribute('style') || ''
  }));

  // Function to block already booked slots
  async function updateAvailableSlots() {
    const selectedDate = dateInput.value;
    const selectedDuration = parseInt(durationSelect.value) || 1;
    if (!selectedDate) return;

    // Show loading state
    timeSelect.innerHTML = '<option disabled selected>Checking availability...</option>';

    try {
      const q = query(collection(db, 'bookings'), where('date', '==', selectedDate));
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map(doc => doc.data()).filter(b => b.status !== 'cancelled');

      // Get current time for comparison if date is today
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHour = now.getHours() + now.getMinutes() / 60;

      // Helper: "10:00 AM" -> 10.0
      function toHour(timeStr) {
        if (!timeStr || typeof timeStr !== 'string') return -1;
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!match) return -1;
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        const amp = match[3].toUpperCase();
        if (amp === 'PM' && h < 12) h += 12;
        if (amp === 'AM' && h === 12) h = 0;
        return h + m / 60;
      }

      timeSelect.innerHTML = '';

      masterTimeOptions.forEach(opt => {
        if (opt.value === "" || opt.text.toLowerCase().includes('select')) {
          const o = document.createElement('option');
          o.value = opt.value;
          o.text = opt.text;
          o.disabled = true;
          o.selected = true;
          timeSelect.appendChild(o);
          return;
        }

        const slotHour = toHour(opt.text);

        // 1. Check if slot is in the past (for today)
        const isPast = (selectedDate === todayStr) && (slotHour < (currentHour + 0.1)); // 0.1 is 6 mins buffer

        // 2. Check if slot overlaps with existing booking
        let isBooked = false;
        for (const b of bookings) {
          const start = toHour(b.time);
          const end = start + (parseInt(b.duration) || 1);
          if (slotHour >= start && slotHour < end) {
            isBooked = true;
            break;
          }
        }

        const newOpt = document.createElement('option');
        newOpt.value = opt.value || opt.text;

        if (isPast) {
          // Generally better to just not show or disable past slots
          newOpt.text = `${opt.text} (Passed)`;
          newOpt.disabled = true;
          newOpt.style.color = '#6a5880';
        } else if (isBooked) {
          newOpt.text = `${opt.text} (Booked)`;
          newOpt.disabled = true;
          newOpt.style.color = '#ff4757';
        } else {
          newOpt.text = opt.text;
          newOpt.disabled = false;
        }

        timeSelect.appendChild(newOpt);
      });
    } catch (err) {
      console.error("Error checking slots:", err);
      // Fallback: restore master options
      timeSelect.innerHTML = '';
      masterTimeOptions.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.text = opt.text;
        timeSelect.appendChild(o);
      });
    }
  }

  dateInput.addEventListener('change', updateAvailableSlots);
  durationSelect.addEventListener('change', () => {
    updateAvailableSlots();
    updateTotal();
  });

  await updateAvailableSlots(); // Run on initial load

  function updateTotal() {
    const players = parseInt(playersSelect.value) || 0;
    const duration = parseInt(durationSelect.value) || 0;
    const rate = pricing[players] || 0;
    const total = rate * duration;

    totalDisplay.textContent = `₹${total}`;

    totalDisplay.style.transform = 'scale(1.1)';
    setTimeout(() => {
      totalDisplay.style.transition = 'transform 0.3s ease';
      totalDisplay.style.transform = 'scale(1)';
    }, 150);
  }

  playersSelect.addEventListener('change', updateTotal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedOption = timeSelect.options[timeSelect.selectedIndex];
    if (selectedOption && selectedOption.disabled && selectedOption.value !== "") {
      alert("This slot is already booked. Please choose another time.");
      updateAvailableSlots();
      return;
    }

    const name = document.getElementById('bookName').value.trim();
    const phone = document.getElementById('bookPhone').value.trim();
    const email = document.getElementById('bookEmail').value.trim();
    const date = document.getElementById('bookDate').value;
    const time = document.getElementById('bookTime').value;
    const players = playersSelect.value;
    const duration = durationSelect.value;
    const rate = pricing[parseInt(players)] || 0;
    const total = rate * parseInt(duration);

    try {
      // Save booking to Firestore
      await addDoc(collection(db, 'bookings'), {
        name,
        phone,
        email,
        date,
        time,
        players: parseInt(players),
        duration: parseInt(duration),
        total,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // ——— SEND EMAIL VIA GOOGLE APPS SCRIPT ———
      // Fetch your Google Script URL from Firestore config (suggested key: 'gas_url')
      const gasUrl = await fetchConfig('gas_url', '');

      if (gasUrl) {
        try {
          // Fire and forget (don't wait for email to send before opening WhatsApp)
          fetch(gasUrl, {
            method: 'POST',
            mode: 'no-cors', // Google Script requires no-cors for simple trigger
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              email,
              phone,
              date,
              time,
              players,
              duration,
              total
            })
          });
          console.log("Confirmation email request sent!");
        } catch (emailErr) {
          console.error("Email request failed:", emailErr);
        }
      } else {
        console.warn("Google Apps Script URL (gas_url) not found in config.");
      }

      // Format date nicely
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const whatsappNum = settings.whatsapp || '919790513631';
      const message = encodeURIComponent(
        `Hi! I want to book a slot at Prabuto Gaming Cafe.\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Email: ${email}\n` +
        `Date: ${formattedDate}\n` +
        `Time: ${time}\n` +
        `Players: ${players}\n` +
        `Duration: ${duration} Hour(s)\n` +
        `Total: ₹${total}`
      );

      window.open(`https://wa.me/${whatsappNum}?text=${message}`, '_blank');
    } catch (err) {
      console.error("Error saving booking:", err);
      alert("Something went wrong. Please try again or book via WhatsApp.");
    }
  });
}

function setMinDate() {
  const dateInput = document.getElementById('bookDate');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
  }
}

// ============================================================
// OPENING HOURS
// ============================================================
async function initHoursTable() {
  const tbody = document.getElementById('hoursTableBody');
  const statusEl = document.getElementById('hoursStatus');
  if (!tbody || !statusEl) return;

  const hours = await fetchConfig('hours', DEFAULT_HOURS);
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon...
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Map JS day (0=Sun) to our array (0=Mon)
  const dayIndex = currentDay === 0 ? 6 : currentDay - 1;
  const todayData = hours[dayIndex];

  // Parse time strings (HH:MM) to decimal hours
  function parseTime(t) {
    const [h, m] = t.split(':').map(Number);
    return h + (m || 0) / 60;
  }

  const openH = parseTime(todayData.open);
  const closeH = parseTime(todayData.close);
  const isOpen = currentHour >= openH && currentHour < closeH;

  statusEl.innerHTML = isOpen
    ? '<span class="status-badge open">🟢 OPEN NOW</span>'
    : '<span class="status-badge closed">🔴 CLOSED</span>';

  // Format time for display (HH:MM -> h:mm AM/PM)
  function formatTime(t) {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  }

  tbody.innerHTML = hours.map((h, i) => `
    <tr class="${i === dayIndex ? 'today' : ''}">
      <td>${h.day}${i === dayIndex ? ' ✦' : ''}</td>
      <td>${formatTime(h.open)} – ${formatTime(h.close)}</td>
    </tr>
  `).join('');
}

// ============================================================
// SCROLL REVEAL
// ============================================================
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ============================================================
// SMOOTH SCROLL
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
