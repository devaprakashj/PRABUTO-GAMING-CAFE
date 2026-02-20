/* ============================================================
   PRABUTO GAMING CAFE — Admin Dashboard Logic
   ============================================================ */

import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, addDoc, onSnapshot, query, orderBy, limit } from './firebase.js';

// ——— DEFAULT DATA ———
const DEFAULT_PASSWORD = 'prabuto2025';

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

const DEFAULT_SETTINGS = {
    storeName: 'PRABUTO GAMING CAFE',
    tagline: 'Level Up Your Experience',
    phone: '9790513631',
    whatsapp: '919790513631',
    instagram: 'https://www.instagram.com/prabuto_gaming_cafe/',
    address: 'Plot No.35/1, 3rd N St, South part, Sivathipatti Road, Thiyagaraja Nagar, Tirunelveli, Tamil Nadu 627011',
    mapLink: 'https://maps.app.goo.gl/UccTxKMbnrkv5uDW9'
};

// ——— HELPERS ———
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

async function saveConfig(key, value) {
    try {
        const docRef = doc(db, 'config', key);
        await setDoc(docRef, { value });
    } catch (err) {
        console.error("Error saving config:", err);
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Global cached data
let bookingsCache = [];

// ——— DOM READY ———
document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initSidebar();
    initOverview();
    initBookings();
    initGames();
    initPricing();
    initHours();
    initSettings();
});

// ============================================================
// LOGIN
// ============================================================
async function initLogin() {
    const screen = document.getElementById('loginScreen');
    const dash = document.getElementById('dashboard');
    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');

    // Check if already logged in
    if (sessionStorage.getItem('prabuto_admin_auth') === 'true') {
        screen.style.display = 'none';
        dash.style.display = 'flex';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = document.getElementById('loginPass').value;
        const storedPass = await fetchConfig('admin_password', DEFAULT_PASSWORD);

        if (pass === storedPass) {
            sessionStorage.setItem('prabuto_admin_auth', 'true');
            screen.style.display = 'none';
            dash.style.display = 'flex';
            errorEl.textContent = '';
        } else {
            errorEl.textContent = '❌ Incorrect password. Try again.';
            document.getElementById('loginPass').value = '';
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('prabuto_admin_auth');
        screen.style.display = 'flex';
        dash.style.display = 'none';
        document.getElementById('loginPass').value = '';
    });
}

// ============================================================
// SIDEBAR NAVIGATION
// ============================================================
function initSidebar() {
    const links = document.querySelectorAll('.sidebar-link[data-panel]');
    const panels = document.querySelectorAll('.panel');
    const sidebar = document.getElementById('sidebar');
    const mobileToggle = document.getElementById('mobileToggle');

    links.forEach(link => {
        link.addEventListener('click', async () => {
            const panelId = link.dataset.panel;

            // Update active link
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show panel
            panels.forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${panelId}`).classList.add('active');

            // Close mobile sidebar
            sidebar.classList.remove('open');

            // Refresh data when switching panels
            if (panelId === 'overview') refreshOverview();
            if (panelId === 'bookings') renderBookings();
            if (panelId === 'games') renderAllGames();
        });
    });

    // Mobile toggle
    mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}

// ============================================================
// OVERVIEW
// ============================================================
async function initOverview() {
    // Set current date
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Initial load
    refreshOverview();
}

async function refreshOverview() {
    // Analytics and stats
    const games = await fetchConfig('games', DEFAULT_GAMES);
    const today = new Date().toISOString().split('T')[0];

    const todayBookings = bookingsCache.filter(b => b.date === today);
    const totalRevenue = bookingsCache.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalGames = Object.values(games).reduce((sum, arr) => sum + arr.length, 0);

    document.getElementById('statTotalBookings').textContent = bookingsCache.length;
    document.getElementById('statTodayBookings').textContent = todayBookings.length;
    document.getElementById('statRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('statGames').textContent = totalGames;

    // Recent bookings (last 5)
    const recent = bookingsCache.slice(-5).reverse();
    const tbody = document.getElementById('recentBookingsBody');

    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No bookings yet</td></tr>';
    } else {
        tbody.innerHTML = recent.map(b => `
      <tr>
        <td>${b.name}</td>
        <td>${formatDate(b.date)}</td>
        <td>${b.time}</td>
        <td>${b.players}P</td>
        <td><span class="badge badge-${b.status || 'pending'}">${(b.status || 'pending').toUpperCase()}</span></td>
      </tr>
    `).join('');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================
// BOOKINGS
// ============================================================
async function initBookings() {
    // Real-time listener for bookings
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'asc'));
    onSnapshot(q, (snapshot) => {
        bookingsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBookings();
        refreshOverview();
    });

    // Booking ON/OFF toggle
    const toggle = document.getElementById('bookingToggle');
    const label = document.getElementById('bookingStatusLabel');
    const isEnabled = await fetchConfig('booking_enabled', true);

    toggle.checked = isEnabled;
    updateToggleLabel(label, isEnabled);

    toggle.addEventListener('change', async () => {
        const enabled = toggle.checked;
        await saveConfig('booking_enabled', enabled);
        updateToggleLabel(label, enabled);
        showToast(enabled ? '✅ Booking is now OPEN' : '🔴 Booking is now CLOSED');
    });

    document.getElementById('clearBookingsBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear ALL bookings? This cannot be undone.')) {
            const querySnapshot = await getDocs(collection(db, "bookings"));
            for (const doc of querySnapshot.docs) {
                await deleteDoc(doc.ref);
            }
            showToast('✅ All bookings cleared');
        }
    });
}

function updateToggleLabel(label, enabled) {
    label.textContent = enabled ? 'Booking: ON' : 'Booking: OFF';
    label.classList.toggle('off', !enabled);
}

function renderBookings() {
    const tbody = document.getElementById('bookingsBody');

    if (bookingsCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-msg">No bookings yet. Bookings from the website will appear here.</td></tr>';
        return;
    }

    tbody.innerHTML = bookingsCache.slice().reverse().map((b) => {
        return `
      <tr>
        <td>${b.name}</td>
        <td><a href="tel:${b.phone}" style="color: var(--accent); text-decoration: none;">${b.phone || '-'}</a></td>
        <td>${formatDate(b.date)}</td>
        <td>${b.time}</td>
        <td>${b.players}P</td>
        <td>${b.duration}hr</td>
        <td>₹${b.total}</td>
        <td>
          <select class="badge-select" onchange="updateBookingStatus('${b.id}', this.value)">
            <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div class="action-group">
            <button class="btn-icon-only" title="View Details" onclick="viewBooking('${b.id}')">👁️</button>
            <button class="btn-icon-only" title="Delete" onclick="deleteBooking('${b.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
}

// Global functions for inline handlers
window.viewBooking = function (id) {
    const b = bookingsCache.find(item => item.id === id);
    if (!b) return;

    const detailHtml = `
      <div class="booking-details">
        <div class="detail-row"><strong>Name:</strong> <span>${b.name}</span></div>
        <div class="detail-row"><strong>Phone:</strong> <span>${b.phone || 'N/A'}</span></div>
        <div class="detail-row"><strong>Date:</strong> <span>${formatDate(b.date)}</span></div>
        <div class="detail-row"><strong>Time:</strong> <span>${b.time}</span></div>
        <div class="detail-row"><strong>Players:</strong> <span>${b.players} Players</span></div>
        <div class="detail-row"><strong>Duration:</strong> <span>${b.duration} Hour(s)</span></div>
        <div class="detail-row"><strong>Total:</strong> <span>₹${b.total}</span></div>
        <div class="detail-row"><strong>Status:</strong> <span class="badge badge-${b.status}">${(b.status || 'pending').toUpperCase()}</span></div>
        <div class="detail-actions" style="margin-top: 20px; display: flex; gap: 10px;">
          <a href="tel:${b.phone}" class="btn-action" style="flex:1; text-align:center; padding: 10px; text-decoration: none;">📞 Call</a>
          <a href="https://wa.me/91${b.phone}" target="_blank" class="btn-action btn-success" style="flex:1; text-align:center; padding: 10px; text-decoration: none;">💬 WhatsApp</a>
        </div>
      </div>
    `;

    openModal('Booking Details', detailHtml, null, true);
};

window.updateBookingStatus = async function (id, status) {
    try {
        const docRef = doc(db, 'bookings', id);
        await updateDoc(docRef, { status });
        showToast(`✅ Booking marked as ${status}`);
    } catch (err) {
        showToast('❌ Error updating status');
    }
};

window.deleteBooking = async function (id) {
    if (!confirm('Delete this booking?')) return;
    try {
        await deleteDoc(doc(db, 'bookings', id));
        showToast('🗑️ Booking deleted');
    } catch (err) {
        showToast('❌ Error deleting booking');
    }
};

// ============================================================
// GAMES MANAGER
// ============================================================
let currentGameCategory = '';

async function initGames() {
    renderAllGames();

    // Add game buttons
    document.querySelectorAll('.btn-add[data-category]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentGameCategory = btn.dataset.category;
            openModal('Add Game', `<input type="text" id="newGameName" placeholder="Enter game name" autofocus />`, async () => {
                const name = document.getElementById('newGameName').value.trim();
                if (!name) return;
                const games = await fetchConfig('games', DEFAULT_GAMES);
                if (!games[currentGameCategory]) games[currentGameCategory] = [];
                if (games[currentGameCategory].includes(name)) {
                    showToast('⚠️ Game already exists');
                    return;
                }
                games[currentGameCategory].push(name);
                await saveConfig('games', games);
                renderAllGames();
                closeModal();
                showToast(`✅ "${name}" added`);
                refreshOverview();
            });
        });
    });
}

async function renderAllGames() {
    const games = await fetchConfig('games', DEFAULT_GAMES);

    ['4players', '2players', '1player'].forEach(cat => {
        const list = document.getElementById(`games-${cat}`);
        const items = games[cat] || [];

        list.innerHTML = items.map((g, i) => `
      <div class="game-tag">
        🎮 ${g}
        <button class="remove-game" onclick="removeGame('${cat}', ${i})" title="Remove">&times;</button>
      </div>
    `).join('') || '<span style="color:var(--text-muted);">No games added</span>';
    });
}

window.removeGame = async function (cat, idx) {
    const games = await fetchConfig('games', DEFAULT_GAMES);
    if (games[cat]) {
        const removed = games[cat].splice(idx, 1);
        await saveConfig('games', games);
        renderAllGames();
        showToast(`🗑️ "${removed}" removed`);
        refreshOverview();
    }
};

// ============================================================
// PRICING
// ============================================================
async function initPricing() {
    const pricing = await fetchConfig('pricing', DEFAULT_PRICING);

    document.getElementById('price4').value = pricing[4] || 240;
    document.getElementById('price3').value = pricing[3] || 200;
    document.getElementById('price2').value = pricing[2] || 160;
    document.getElementById('price1').value = pricing[1] || 120;

    document.getElementById('savePricingBtn').addEventListener('click', async () => {
        const newPricing = {
            4: parseInt(document.getElementById('price4').value) || 0,
            3: parseInt(document.getElementById('price3').value) || 0,
            2: parseInt(document.getElementById('price2').value) || 0,
            1: parseInt(document.getElementById('price1').value) || 0
        };
        await saveConfig('pricing', newPricing);
        showToast('✅ Pricing saved successfully');
    });
}

// ============================================================
// HOURS
// ============================================================
async function initHours() {
    const hours = await fetchConfig('hours', DEFAULT_HOURS);
    const editor = document.getElementById('hoursEditor');

    editor.innerHTML = hours.map((h, i) => `
    <div class="hour-row">
      <label>${h.day}</label>
      <input type="time" id="hour-open-${i}" value="${h.open}" />
      <input type="time" id="hour-close-${i}" value="${h.close}" />
    </div>
  `).join('');

    document.getElementById('saveHoursBtn').addEventListener('click', async () => {
        const newHours = hours.map((h, i) => ({
            day: h.day,
            open: document.getElementById(`hour-open-${i}`).value,
            close: document.getElementById(`hour-close-${i}`).value
        }));
        await saveConfig('hours', newHours);
        showToast('✅ Opening hours saved');
    });
}

// ============================================================
// SETTINGS
// ============================================================
async function initSettings() {
    const settings = await fetchConfig('settings', DEFAULT_SETTINGS);

    document.getElementById('setStoreName').value = settings.storeName || '';
    document.getElementById('setTagline').value = settings.tagline || '';
    document.getElementById('setPhone').value = settings.phone || '';
    document.getElementById('setWhatsapp').value = settings.whatsapp || '';
    document.getElementById('setInstagram').value = settings.instagram || '';
    document.getElementById('setAddress').value = settings.address || '';
    document.getElementById('setMapLink').value = settings.mapLink || '';

    document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
        const newSettings = {
            storeName: document.getElementById('setStoreName').value.trim(),
            tagline: document.getElementById('setTagline').value.trim(),
            phone: document.getElementById('setPhone').value.trim(),
            whatsapp: document.getElementById('setWhatsapp').value.trim(),
            instagram: document.getElementById('setInstagram').value.trim(),
            address: document.getElementById('setAddress').value.trim(),
            mapLink: document.getElementById('setMapLink').value.trim()
        };

        // Handle password change
        const newPass = document.getElementById('setPassword').value.trim();
        if (newPass) {
            if (newPass.length < 4) {
                showToast('⚠️ Password must be at least 4 characters');
                return;
            }
            await saveConfig('admin_password', newPass);
            document.getElementById('setPassword').value = '';
        }

        await saveConfig('settings', newSettings);
        showToast('✅ Settings saved successfully');
    });
}

// ============================================================
// MODAL
// ============================================================
let modalSaveCallback = null;

function openModal(title, bodyHtml, onSave, hideSave = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.add('open');
    modalSaveCallback = onSave;

    const saveBtn = document.getElementById('modalSave');
    if (hideSave) {
        saveBtn.style.display = 'none';
    } else {
        saveBtn.style.display = 'block';
    }

    // Focus first input
    setTimeout(() => {
        const input = document.querySelector('#modalBody input');
        if (input) input.focus();
    }, 100);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    modalSaveCallback = null;
}

document.getElementById('modalSave').addEventListener('click', () => {
    if (modalSaveCallback) modalSaveCallback();
});

document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modalClose').addEventListener('click', closeModal);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

// Handle Enter key in modal
document.getElementById('modalBody').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && modalSaveCallback) {
        e.preventDefault();
        modalSaveCallback();
    }
});
