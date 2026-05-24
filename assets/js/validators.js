/**
 * Валидаторы форм по требованиям задания.
 */
(function () {
  'use strict';

  const RE_LOGIN = /^[A-Za-z0-9]{6,}$/;
  const RE_FIO = /^[А-Яа-яЁё\s\-]+$/;
  const RE_PHONE = /^8\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
  const RE_EMAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  const RE_DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/;

  function login(value) {
    const v = String(value || '').trim();
    if (!v) return 'Введите логин';
    if (v.length < 6) return 'Логин должен содержать не менее 6 символов';
    if (!RE_LOGIN.test(v)) return 'Логин может содержать только латиницу и цифры';
    return null;
  }

  function password(value) {
    const v = String(value || '');
    if (!v) return 'Введите пароль';
    if (v.length < 8) return 'Пароль должен содержать минимум 8 символов';
    return null;
  }

  function fio(value) {
    const v = String(value || '').trim();
    if (!v) return 'Введите ФИО';
    if (!RE_FIO.test(v)) return 'ФИО может содержать только кириллицу и пробелы';
    const parts = v.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return 'Укажите фамилию и имя полностью';
    return null;
  }

  function phone(value) {
    const v = String(value || '').trim();
    if (!v) return 'Введите телефон';
    if (!RE_PHONE.test(v)) return 'Формат: 8(XXX)XXX-XX-XX';
    return null;
  }

  function email(value) {
    const v = String(value || '').trim();
    if (!v) return 'Введите email';
    if (!RE_EMAIL.test(v)) return 'Некорректный адрес электронной почты';
    return null;
  }

  function dateDMY(value) {
    const v = String(value || '').trim();
    if (!v) return 'Укажите дату';
    const m = v.match(RE_DATE);
    if (!m) return 'Формат даты: ДД.ММ.ГГГГ';
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month < 1 || month > 12) return 'Некорректный месяц';
    if (day < 1 || day > 31) return 'Некорректный день';
    const d = new Date(year, month - 1, day);
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return 'Такой даты не существует';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return 'Дата начала обучения не может быть в прошлом';
    return null;
  }

  function required(value, label = 'Поле') {
    if (!value || !String(value).trim()) return `${label} обязательно для заполнения`;
    return null;
  }

  /**
   * Привязывает валидатор к input. Показывает ошибку в .field-error рядом.
   * Возвращает функцию, которая принудительно валидирует и возвращает
   * сообщение об ошибке (или null).
   */
  function bind(input, validator) {
    if (!input) return () => null;
    const errorEl = input.parentElement.querySelector('.field-error');
    const setError = (msg) => {
      if (msg) {
        input.classList.add('is-error');
        if (errorEl) errorEl.textContent = msg;
      } else {
        input.classList.remove('is-error');
        if (errorEl) errorEl.textContent = '';
      }
    };
    const check = () => {
      const msg = validator(input.value);
      setError(msg);
      return msg;
    };
    input.addEventListener('blur', check);
    input.addEventListener('input', () => {
      if (input.classList.contains('is-error')) check();
    });
    return check;
  }

  window.KorValidators = {
    login,
    password,
    fio,
    phone,
    email,
    dateDMY,
    required,
    bind,
  };
})();
