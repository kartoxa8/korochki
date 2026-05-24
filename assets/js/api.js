/**
 * Backend stub for «Корочки.есть».
 *
 * Имитирует REST API на основе localStorage. Все методы возвращают Promise,
 * как настоящий fetch к серверу. Реальный бэкенд должен реализовать тот же
 * интерфейс (см. методы класса Api ниже).
 *
 * Хранилища:
 *   - kor_users[]        { id, login, password, fio, phone, email, createdAt }
 *   - kor_applications[] { id, userId, course, startDate, payment, status,
 *                          review, createdAt, updatedAt }
 *   - kor_session        { userId | 'admin' | null }
 */
(function () {
  'use strict';

  const STORAGE = {
    users: 'kor_users',
    applications: 'kor_applications',
    session: 'kor_session',
  };

  const ADMIN = { login: 'Admin', password: 'KorokNET' };
  const STATUSES = ['Новая', 'Идет обучение', 'Обучение завершено'];

  const COURSES = [
    'Основы алгоритмизации и программирования',
    'Основы веб-дизайна',
    'Основы проектирования баз данных',
  ];

  const PAYMENTS = ['Наличными', 'Переводом по номеру телефона'];

  // --- utilities -----------------------------------------------------------

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Эмулируем сетевой запрос: 120-220ms latency.
  async function simulate() {
    await delay(120 + Math.random() * 100);
  }

  function seed() {
    if (read(STORAGE.users, null) !== null) return;

    const demoUser = {
      id: uid(),
      login: 'student1',
      password: 'demo1234',
      fio: 'Иванов Иван Иванович',
      phone: '8(900)123-45-67',
      email: 'ivanov@example.com',
      createdAt: new Date('2026-04-10T10:00:00').toISOString(),
    };

    write(STORAGE.users, [demoUser]);

    const now = Date.now();
    const apps = [
      {
        id: uid(),
        userId: demoUser.id,
        course: COURSES[0],
        startDate: '01.06.2026',
        payment: PAYMENTS[1],
        status: STATUSES[2],
        review: 'Курс понравился, преподаватель объяснял понятно!',
        createdAt: new Date(now - 12 * 86400000).toISOString(),
        updatedAt: new Date(now - 2 * 86400000).toISOString(),
      },
      {
        id: uid(),
        userId: demoUser.id,
        course: COURSES[1],
        startDate: '15.06.2026',
        payment: PAYMENTS[0],
        status: STATUSES[1],
        review: '',
        createdAt: new Date(now - 5 * 86400000).toISOString(),
        updatedAt: new Date(now - 1 * 86400000).toISOString(),
      },
      {
        id: uid(),
        userId: demoUser.id,
        course: COURSES[2],
        startDate: '01.07.2026',
        payment: PAYMENTS[1],
        status: STATUSES[0],
        review: '',
        createdAt: new Date(now - 1 * 86400000).toISOString(),
        updatedAt: new Date(now - 1 * 86400000).toISOString(),
      },
    ];
    write(STORAGE.applications, apps);
  }

  seed();

  // --- public API ----------------------------------------------------------

  const Api = {
    COURSES,
    PAYMENTS,
    STATUSES,
    ADMIN_LOGIN: ADMIN.login,

    async register(data) {
      await simulate();
      const users = read(STORAGE.users, []);
      if (users.some((u) => u.login.toLowerCase() === data.login.toLowerCase())) {
        const err = new Error('Пользователь с таким логином уже существует');
        err.code = 'LOGIN_TAKEN';
        throw err;
      }
      const user = {
        id: uid(),
        login: data.login,
        password: data.password,
        fio: data.fio,
        phone: data.phone,
        email: data.email,
        createdAt: new Date().toISOString(),
      };
      users.push(user);
      write(STORAGE.users, users);
      return { id: user.id, login: user.login, fio: user.fio };
    },

    async login(login, password) {
      await simulate();

      if (login === ADMIN.login && password === ADMIN.password) {
        write(STORAGE.session, { userId: 'admin', role: 'admin' });
        return { role: 'admin', login: ADMIN.login };
      }

      const users = read(STORAGE.users, []);
      const user = users.find((u) => u.login === login && u.password === password);
      if (!user) {
        const err = new Error('Неверный логин или пароль');
        err.code = 'BAD_CREDENTIALS';
        throw err;
      }
      write(STORAGE.session, { userId: user.id, role: 'user' });
      return { role: 'user', login: user.login, fio: user.fio, id: user.id };
    },

    logout() {
      localStorage.removeItem(STORAGE.session);
    },

    getSession() {
      const session = read(STORAGE.session, null);
      if (!session) return null;
      if (session.role === 'admin') {
        return { role: 'admin', login: ADMIN.login };
      }
      const users = read(STORAGE.users, []);
      const user = users.find((u) => u.id === session.userId);
      if (!user) {
        localStorage.removeItem(STORAGE.session);
        return null;
      }
      return { role: 'user', id: user.id, login: user.login, fio: user.fio };
    },

    async createApplication(data) {
      await simulate();
      const session = this.getSession();
      if (!session || session.role !== 'user') {
        const err = new Error('Требуется авторизация');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
      const apps = read(STORAGE.applications, []);
      const now = new Date().toISOString();
      const app = {
        id: uid(),
        userId: session.id,
        course: data.course,
        startDate: data.startDate,
        payment: data.payment,
        status: STATUSES[0],
        review: '',
        createdAt: now,
        updatedAt: now,
      };
      apps.unshift(app);
      write(STORAGE.applications, apps);
      return app;
    },

    async getMyApplications() {
      await simulate();
      const session = this.getSession();
      if (!session || session.role !== 'user') {
        const err = new Error('Требуется авторизация');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
      const apps = read(STORAGE.applications, []);
      return apps
        .filter((a) => a.userId === session.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async leaveReview(appId, text) {
      await simulate();
      const session = this.getSession();
      if (!session || session.role !== 'user') {
        const err = new Error('Требуется авторизация');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
      const apps = read(STORAGE.applications, []);
      const app = apps.find((a) => a.id === appId && a.userId === session.id);
      if (!app) {
        const err = new Error('Заявка не найдена');
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (app.status !== STATUSES[2]) {
        const err = new Error('Отзыв можно оставить только после завершения обучения');
        err.code = 'NOT_COMPLETED';
        throw err;
      }
      app.review = text;
      app.updatedAt = new Date().toISOString();
      write(STORAGE.applications, apps);
      return app;
    },

    async listAllApplications() {
      await simulate();
      const session = this.getSession();
      if (!session || session.role !== 'admin') {
        const err = new Error('Доступ запрещен');
        err.code = 'FORBIDDEN';
        throw err;
      }
      const apps = read(STORAGE.applications, []);
      const users = read(STORAGE.users, []);
      const byId = new Map(users.map((u) => [u.id, u]));
      return apps
        .map((a) => ({
          ...a,
          user: byId.get(a.userId) || null,
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async setApplicationStatus(appId, status) {
      await simulate();
      const session = this.getSession();
      if (!session || session.role !== 'admin') {
        const err = new Error('Доступ запрещен');
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (!STATUSES.includes(status)) {
        const err = new Error('Неизвестный статус');
        err.code = 'BAD_STATUS';
        throw err;
      }
      const apps = read(STORAGE.applications, []);
      const app = apps.find((a) => a.id === appId);
      if (!app) {
        const err = new Error('Заявка не найдена');
        err.code = 'NOT_FOUND';
        throw err;
      }
      app.status = status;
      app.updatedAt = new Date().toISOString();
      write(STORAGE.applications, apps);
      return app;
    },
  };

  window.KorApi = Api;
})();
