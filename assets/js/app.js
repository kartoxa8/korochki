/**
 * Общая инфраструктура UI: шапка, навигация, тосты, модалки, утилиты.
 * Подключается на каждой странице после api.js.
 */
(function () {
  'use strict';

  const Api = window.KorApi;

  // --- Header & navigation -----------------------------------------------

  function renderHeader() {
    const root = document.getElementById('app-header');
    if (!root) return;
    const session = Api.getSession();
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    const navItems = [];
    if (!session) {
      navItems.push({ href: 'index.html', label: 'Главная' });
      navItems.push({ href: 'login.html', label: 'Войти' });
      navItems.push({ href: 'register.html', label: 'Регистрация' });
    } else if (session.role === 'admin') {
      navItems.push({ href: 'admin.html', label: 'Заявки' });
    } else {
      navItems.push({ href: 'index.html', label: 'Главная' });
      navItems.push({ href: 'applications.html', label: 'Мои заявки' });
      navItems.push({ href: 'new-application.html', label: 'Новая заявка' });
    }

    const links = navItems
      .map((item) => {
        const active = item.href.toLowerCase() === current ? ' active' : '';
        return `<a class="${active}" href="${item.href}">${item.label}</a>`;
      })
      .join('');

    const userInfo = session
      ? `<div class="user-chip" title="${escapeHtml(
          session.role === 'admin' ? 'Администратор' : session.fio || session.login
        )}">
            <span>👤</span>
            <span>${escapeHtml(
              session.role === 'admin' ? 'Admin' : session.login
            )}</span>
          </div>
          <button class="btn btn-ghost btn-sm" id="logout-btn">Выйти</button>`
      : '';

    root.innerHTML = `
      <div class="header-inner">
        <a class="logo" href="index.html">
          <span class="logo-mark">К</span>
          <span>Корочки.есть</span>
        </a>
        <button class="nav-burger" id="nav-burger" aria-label="Меню">☰</button>
        <nav class="nav" id="nav">${links}</nav>
        <div style="display:flex;gap:10px;align-items:center;">
          ${userInfo}
        </div>
      </div>
    `;

    document.getElementById('nav-burger')?.addEventListener('click', () => {
      document.getElementById('nav')?.classList.toggle('open');
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      Api.logout();
      toast('Вы вышли из системы', 'success');
      setTimeout(() => (location.href = 'login.html'), 400);
    });
  }

  function renderFooter() {
    const root = document.getElementById('app-footer');
    if (!root) return;
    root.innerHTML = `© ${new Date().getFullYear()} «Корочки.есть» — портал онлайн-курсов ДПО`;
  }

  // --- Toasts ------------------------------------------------------------

  function ensureToastsContainer() {
    let el = document.querySelector('.toasts');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toasts';
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type = 'info') {
    const container = ensureToastsContainer();
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // --- Modal -------------------------------------------------------------

  function modal({ title, body, confirmText = 'Ок', cancelText = 'Отмена', onConfirm }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop open';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-title">${escapeHtml(title)}</div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-action="cancel">${escapeHtml(cancelText)}</button>
          <button class="btn" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    const close = () => backdrop.remove();
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    backdrop
      .querySelector('[data-action="cancel"]')
      .addEventListener('click', close);
    backdrop
      .querySelector('[data-action="confirm"]')
      .addEventListener('click', async () => {
        try {
          const result = onConfirm && (await onConfirm(backdrop));
          if (result !== false) close();
        } catch (err) {
          // оставляем модалку открытой при ошибке внутри onConfirm
          console.error(err);
        }
      });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  // --- Helpers -----------------------------------------------------------

  function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  function requireAuth(role) {
    const session = Api.getSession();
    if (!session) {
      location.href = 'login.html';
      return null;
    }
    if (role && session.role !== role) {
      location.href = session.role === 'admin' ? 'admin.html' : 'applications.html';
      return null;
    }
    return session;
  }

  function setButtonLoading(btn, loading, originalText) {
    if (!btn) return;
    if (loading) {
      btn.dataset.text = btn.dataset.text || btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span><span>Подождите...</span>';
      btn.disabled = true;
    } else {
      if (btn.dataset.text) btn.innerHTML = btn.dataset.text;
      else if (originalText) btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  // --- Phone mask --------------------------------------------------------

  function applyPhoneMask(input) {
    if (!input) return;
    const format = (digits) => {
      let d = digits.replace(/\D/g, '');
      if (d.startsWith('7')) d = '8' + d.slice(1);
      if (!d.startsWith('8')) d = '8' + d;
      d = d.slice(0, 11);
      const parts = ['8('];
      if (d.length > 1) parts.push(d.slice(1, 4));
      if (d.length >= 4) parts.push(')');
      if (d.length > 4) parts.push(d.slice(4, 7));
      if (d.length > 7) parts.push('-' + d.slice(7, 9));
      if (d.length > 9) parts.push('-' + d.slice(9, 11));
      return parts.join('');
    };
    input.addEventListener('input', () => {
      input.value = format(input.value);
    });
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '8(';
    });
    input.addEventListener('blur', () => {
      if (input.value === '8(') input.value = '';
    });
  }

  // --- Public ------------------------------------------------------------

  window.KorApp = {
    init() {
      renderHeader();
      renderFooter();
    },
    toast,
    modal,
    escapeHtml,
    formatDate,
    requireAuth,
    setButtonLoading,
    applyPhoneMask,
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.KorApp.init();
  });
})();
