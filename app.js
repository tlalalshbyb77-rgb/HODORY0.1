const DEFAULT_SCHEDULE = [
  { id: 'visual', day: 'الأحد', time: '08:30', title: 'البرمجة المرئية', doctor: 'أ. وليد البرغثي', room: 'معمل الحاسوب 2', status: 'confirmed', note: 'المحاضرة قائمة في المعمل.' },
  { id: 'english', day: 'الأحد', time: '10:15', title: 'اللغة الإنجليزية', doctor: 'د. رانيا', room: 'قاعة 3', status: 'pending', note: '' },
  { id: 'data', day: 'الأحد', time: '12:00', title: 'تراكيب بيانات وخوارزميات', doctor: 'د. عايدة زقوزي', room: 'قاعة 12', status: 'cancelled', note: 'تم تأجيل المحاضرة إلى موعد يعلن لاحقًا.' },
  { id: 'web', day: 'الاثنين', time: '09:00', title: 'مقدمة في برمجة الإنترنت', doctor: 'أ. وليد البرغثي', room: 'معمل الحاسوب 2', status: 'pending', note: '' },
  { id: 'research', day: 'الاثنين', time: '11:00', title: 'منهجية بحث', doctor: 'د. وجدان', room: 'قاعة 3', status: 'confirmed', note: 'يرجى إحضار مشروع البحث.' }
];

const STATUS = { confirmed: 'قائمة', cancelled: 'ملغاة', pending: 'بانتظار التأكيد' };
const DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
let selectedDay = 'الأحد';

function getLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function setLocal(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function getSchedule() { return getLocal('hodory-schedule', DEFAULT_SCHEDULE); }
function getUpdates() { return getLocal('hodory-updates', []); }
function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value || ''; return element.innerHTML; }
function formatTime(time) { return new Intl.DateTimeFormat('ar-LY', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${time}`)); }
function nowLabel() { return new Intl.DateTimeFormat('ar-LY', { hour: 'numeric', minute: '2-digit' }).format(new Date()); }

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('hodory-theme', theme);
  const isDark = theme === 'dark';
  const toggle = document.getElementById('themeToggle');
  toggle.setAttribute('aria-pressed', String(isDark));
  toggle.setAttribute('aria-label', isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن');
  toggle.querySelector('span').textContent = isDark ? '☀' : '☾';
  toggle.querySelector('.theme-label').textContent = isDark ? 'فاتح' : 'داكن';
}
function showToast(message, type = '') {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 3200);
}
function statusBadge(status) { return `<span class="badge ${status}">${STATUS[status]}</span>`; }

function renderDays() {
  document.getElementById('daySelector').innerHTML = DAYS.map(day => `<button class="day-button ${day === selectedDay ? 'is-active' : ''}" type="button" data-day="${day}">${day}</button>`).join('');
  document.querySelectorAll('[data-day]').forEach(button => button.addEventListener('click', () => { selectedDay = button.dataset.day; renderStudent(); }));
}
function renderSchedule() {
  const courses = getSchedule().filter(course => course.day === selectedDay);
  const list = document.getElementById('scheduleList');
  list.innerHTML = courses.length ? courses.map(course => `<article class="schedule-card"><time class="schedule-time">${formatTime(course.time)}</time><div><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.doctor)} · ${escapeHtml(course.room)}</p>${course.note ? `<p>${escapeHtml(course.note)}</p>` : ''}</div>${statusBadge(course.status)}</article>`).join('') : '<p class="empty">لا توجد محاضرات مجدولة في هذا اليوم.</p>';
}
function renderNotices() {
  const notices = getUpdates();
  const list = document.getElementById('noticeList');
  document.getElementById('noticeCount').textContent = notices.length;
  list.innerHTML = notices.length ? notices.slice(0, 5).map(item => `<article class="notice"><div class="notice-head"><h3>${escapeHtml(item.title)}</h3><time>${escapeHtml(item.time)}</time></div><p>${escapeHtml(item.message)}</p></article>`).join('') : '<p class="empty">لا توجد إعلانات جديدة. سيظهر أي تحديث من الدكتور هنا.</p>';
  const latest = notices[0];
  document.getElementById('highlightTitle').textContent = latest ? latest.title : 'كل ما يهم يومك الدراسي في مكان واحد';
  document.getElementById('highlightText').textContent = latest ? latest.message : 'تابع حالة المحاضرات والرسائل الجديدة بدون الرجوع إلى مجموعات متعددة.';
}
function renderStudent() {
  const todayCourses = getSchedule().filter(course => course.day === selectedDay);
  document.getElementById('confirmedCount').textContent = todayCourses.filter(course => course.status === 'confirmed').length;
  document.getElementById('cancelledCount').textContent = todayCourses.filter(course => course.status === 'cancelled').length;
  document.getElementById('pendingCount').textContent = todayCourses.filter(course => course.status === 'pending').length;
  renderDays(); renderSchedule(); renderNotices();
}

function renderDoctorForm() {
  const select = document.getElementById('courseSelect');
  select.innerHTML = getSchedule().map(course => `<option value="${course.id}">${escapeHtml(course.title)} · ${course.day}</option>`).join('');
}
function publishUpdate(event) {
  event.preventDefault();
  const courseId = document.getElementById('courseSelect').value;
  const status = document.getElementById('statusSelect').value;
  const room = document.getElementById('roomSelect').value;
  const time = document.getElementById('startTime').value;
  const message = document.getElementById('announcement').value.trim();
  const schedule = getSchedule();
  const course = schedule.find(item => item.id === courseId);
  if (!course) return;
  course.status = status; course.room = room; course.time = time;
  course.note = message || `تم تحديث حالة المحاضرة: ${STATUS[status]}.`;
  setLocal('hodory-schedule', schedule);
  const updates = getUpdates();
  updates.unshift({ title: `${course.title} · ${STATUS[status]}`, message: course.note, time: `اليوم، ${nowLabel()}`, courseId });
  setLocal('hodory-updates', updates);
  document.getElementById('announcement').value = '';
  selectedDay = course.day;
  renderStudent(); renderAdmin();
  showToast('تم نشر التحديث. سيظهر الآن في لوحة الطالب.');
}

function renderAdmin() {
  const schedule = getSchedule(); const updates = getUpdates();
  document.getElementById('courseCount').textContent = schedule.length;
  document.getElementById('updateCount').textContent = updates.length;
  document.getElementById('adminPendingCount').textContent = schedule.filter(course => course.status === 'pending').length;
  document.getElementById('adminTable').innerHTML = schedule.map(course => `<tr><td>${escapeHtml(course.title)}</td><td>${escapeHtml(course.doctor)}</td><td>${escapeHtml(course.room)}</td><td>${statusBadge(course.status)}</td></tr>`).join('');
  const activity = document.getElementById('activityList');
  activity.innerHTML = updates.length ? updates.slice(0, 5).map(item => `<article class="notice"><div class="notice-head"><h3>${escapeHtml(item.title)}</h3><time>${escapeHtml(item.time)}</time></div><p>${escapeHtml(item.message)}</p></article>`).join('') : '<p class="empty">لا توجد تغييرات منشورة حتى الآن.</p>';
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(section => { const active = section.id === `${view}View`; section.classList.toggle('is-active', active); section.hidden = !active; });
  document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('is-active', button.dataset.view === view));
  if (view === 'admin') renderAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function resetDemo() {
  localStorage.removeItem('hodory-schedule'); localStorage.removeItem('hodory-updates');
  selectedDay = 'الأحد'; renderStudent(); renderDoctorForm(); renderAdmin();
  showToast('تمت إعادة البيانات التجريبية إلى وضعها الأصلي.');
}

document.addEventListener('DOMContentLoaded', () => {
  const date = new Intl.DateTimeFormat('ar-LY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  document.getElementById('currentDate').textContent = date;
  setTheme(document.documentElement.dataset.theme);
  document.getElementById('themeToggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
  document.querySelector('[data-scroll-to="notices"]').addEventListener('click', () => document.getElementById('notices').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.getElementById('updateForm').addEventListener('submit', publishUpdate);
  document.getElementById('resetDemo').addEventListener('click', resetDemo);
  renderStudent(); renderDoctorForm(); renderAdmin();
});
