# Uptime Kuma — Инструкционный контекст проекта

## Обзор проекта

**Uptime Kuma** — это self-hosted инструмент мониторинга доступности с удобным веб-интерфейсом. Это форк оригинального проекта [louislam/uptime-kuma](https://github.com/louislam/uptime-kuma) с добавленной поддержкой мультипользовательского режима.

### Ключевые возможности

- Мониторинг HTTP(s)/TCP/Keyword/Json Query/WebSocket/Ping/DNS/Push/Steam Game Server/Docker
- Интервал проверки от 20 секунд
- Уведомления через Telegram, Discord, Gotify, Slack, Pushover, Email (SMTP) и 90+ сервисов
- Несколько страниц статуса с защитой (публичная/по паролю/только для пользователей)
- Графики пинга, информация о TLS-сертификатах
- Поддержка прокси и 2FA
- **Мультипользовательский режим** — роли admin/user, избирательный шаринг мониторов

### Технологии

- **Backend**: Node.js + Express.js + Socket.IO
- **Frontend**: Vue 3 + Vite + Vue Router + Chart.js
- **База данных**: SQLite (по умолчанию), поддержка PostgreSQL, MySQL, MariaDB, MS SQL, Oracle
- **Стилизация**: Bootstrap 5 + SCSS
- **Локализация**: Vue I18n
- **Тестирование**: Playwright (E2E), Node.js test runner (backend)

## Структура проекта

```
uptime-kuma/
├── config/              # Конфигурационные файлы для разработки (Vite, Playwright)
├── data/                # Данные приложения (создаётся при запуске)
├── db/                  # Базовая БД и миграции
│   ├── knex_migrations/ # Миграции базы данных
│   ├── old_migrations/  # Старые миграции
│   └── kuma.db          # SQLite база данных
├── dist/                # Собранный фронтенд (продакшен)
├── docker/              # Docker-файлы
├── extra/               # Дополнительные утилиты и скрипты
├── public/              # Статические ресурсы для разработки
├── server/              # Серверная часть (бэкенд)
│   ├── jobs/            # Фоновые задачи
│   ├── model/           # Объектные модели, маппинг к БД
│   ├── modules/         # Модифицированные сторонние модули
│   ├── monitor-types/   # Типы мониторов
│   ├── notification-providers/ # Провайдеры уведомлений
│   ├── routers/         # Express роутеры
│   ├── socket-handlers/ # Socket.IO обработчики
│   └── server.js        # Точка входа сервера
├── src/                 # Клиентская часть (фронтенд)
│   ├── components/      # Vue компоненты
│   ├── lang/            # Локализации (i18n)
│   ├── layouts/         # Vue layouts
│   ├── mixins/          # Vue mixins (логика сокетов)
│   ├── modules/         # Модули фронтенда
│   ├── pages/           # Страницы приложения
│   └── router.js        # Vue Router
└── test/                # Тесты
```

## Команды для разработки

### Установка зависимостей

```bash
npm ci              # Установка всех зависимостей
npm run setup       # Полная настройка (checkout ветки + установка + загрузка dist)
```

### Запуск в режиме разработки

```bash
npm run dev                     # Запуск фронтенд (порт 3000) + бэкенд (порт 3001)
npm run start-frontend-dev      # Только фронтенд dev-сервер
npm run start-server-dev        # Только бэкенд сервер
npm run start-server-dev:watch  # Бэкенд с автоматическим перезапуском
```

### Сборка

```bash
npm run build                   # Сборка фронтенда в dist/
npm run build-dist-and-restart  # Сборка + перезапуск сервера
```

### Тестирование

```bash
npm test                        # Запуск всех тестов (backend + E2E)
npm run test-backend            # Тесты бэкенда
npm run test-backend-22         # Тесты бэкенда (Node 22)
npm run test-backend-20         # Тесты бэкенда (Node 20)
npm run test-e2e                # E2E тесты с Playwright
npm run test-e2e-ui             # E2E тесты с UI
npm run test-with-build         # Сборка + тесты
```

### Линтинг и форматирование

```bash
npm run lint                    # Проверка ESLint + Stylelint
npm run lint:prod               # Проверка для продакшена
npm run fmt                     # Форматирование с Prettier
npm run lint-fix:js             # Авто-исправление ESLint проблем
npm run lint-fix:style          # Авто-исправление Stylelint проблем
```

### Docker

```bash
docker compose up -d            # Запуск в Docker (Caddy + Uptime Kuma)
docker compose up -d --build    # Пересборка и запуск
npm run quick-run-nightly       # Быстрый запуск nightly версии
```

### Утилиты

```bash
npm run reset-password          # Сброс пароля
npm run remove-2fa              # Удаление 2FA
npm run simple-dns-server       # Запуск тестового DNS сервера
npm run simple-mqtt-server      # Запуск тестового MQTT сервера
npm run simple-mongo            # Запуск MongoDB в Docker
npm run simple-postgres         # Запуск PostgreSQL в Docker
npm run simple-mariadb          # Запуск MariaDB в Docker
```

## Соглашения по кодированию

### Именование

- **JavaScript/TypeScript**: `camelCase` для переменных и функций (`myVariable`, `getData()`)
- **SQLite**: `snake_case` (`user_id`, `monitor_name`)
- **CSS/SCSS**: `kebab-case` (`my-class`, `font-size`)

### Стиль кода

- Отступы: **4 пробела**
- Следуйте `.editorconfig` конфигурации
- Следуйте ESLint правилам (настроены в `.eslintrc.js`)
- Методы и функции должны быть задокументированы с помощью **JSDoc**
- Избегайте `var`, используйте `let` и `const`
- Используйте тернарные операторы только когда это читаемо

### TypeScript

- Бэкенд использует TypeScript для некоторых файлов
- TypeScript конфигурация: `tsconfig-backend.json`
- Основные типы проверяются через ESLint с `@typescript-eslint`

### Vue компоненты

- Используйте Vue 3 Composition API и Options API
- Документируйте props и emits с помощью JSDoc
- Следуйте Vue style guide (проверка через `vue-eslint-parser`)

### Git

- **master**: разработка версии 2.X.X (основная ветка для новых фич)
- **1.23.X**: фиксы для версии 1.X.X (багфиксы)
- Коммиты должны быть атомарными и описательными

## Архитектура приложения

### Бэкенд

- Express.js сервер с интегрированным Socket.IO
- Большинство серверной логики находится в Socket.IO обработчиках (`server/socket-handlers/`)
- База данных: SQLite через `@louislam/sqlite3` + Knex для миграций
- Модель данных: файлы в `server/model/` автоматически маппятся к таблицам БД
- Типы мониторов: логика проверок в `server/monitor-types/`
- Уведомления: каждый провайдер в `server/notification-providers/`

### Фронтенд

- Single Page Application (SPA) на Vue 3
- Роутинг: `src/router.js`
- Данные и сокеты: `src/mixins/socket.js` (централизованное управление состоянием)
-大多数数据存储在 root level,即使路由导航到不同页面

## Важные файлы

| Файл | Описание |
|------|----------|
| `server/server.js` | Точка входа сервера |
| `server/uptime-kuma-server.js` | Основной класс сервера (UptimeKumaServer) |
| `src/App.vue` | Корневой Vue компонент |
| `src/main.js` | Точка входа фронтенда |
| `src/router.js` | Конфигурация Vue Router |
| `src/mixins/socket.js` | Логика Socket.IO и управление данными |
| `config/vite.config.js` | Конфигурация Vite |
| `package.json` | Все зависимости и скрипты |

## Зависимости

- **Backend dependencies** (`dependencies`): используются в продакшене (express, socket.io, sqlite3, и др.)
- **Frontend dependencies** (`devDependencies`): собираются в `dist/`, не используются в продакшене отдельно
- **Dev dependencies** (`devDependencies`): только для разработки (eslint, sass, и др.)

**Обновление зависимостей**: Обновляйте только patch-версии (третья цифра в semver). Если нужно обновить major/minor версию, проверьте breaking changes самостоятельно.

## Требования к системе

- **Node.js**: >= 20.4.0
- **npm**: >= 9.3
- **ОС**: Linux (Debian, Ubuntu, Fedora, Arch) или Windows 10 x64 / Server 2012 R2+
- **Для Docker**: Docker + Docker Compose

## Процессы разработки

### Pull Requests

- **Малые, не ломающие багфиксы**: можно создавать PR напрямую
- **Новые фичи / крупные изменения**: сначала откройте issue или draft PR для обсуждения
- **Переводы / i18n**: Добавляйте все строки в `src/lang/en.json`. Не включайте другие языки.
- **Новые провайдеры уведомлений**: Следуйте инструкциям в CONTRIBUTING.md, добавьте скриншоты тестов
- **Новые типы мониторинга**: Следуйте инструкциям в CONTRIBUTING.md

### Стандарты PR

- Один PR = одна проблема (по возможности)
- Все CI проверки должны проходить
- Без breaking changes (если не обсуждалось заранее)
- UI/UX должен соответствовать стилю Uptime Kuma
- Не модифицируйте существующую логику без веской причины
- Тестируйте код перед отправкой

### Тестирование

- Backend тесты: `test/backend-test/`
- E2E тесты: Playwright конфигурация в `config/playwright.config.js`
- Для новой функциональности добавляйте тесты

## Полезные заметки

- Приложение стремится к простоте установки (как установка мобильного приложение)
- Настройки должны конфигурироваться через фронтенд, а не environment variables
- Для отладки фронтенда используйте Vue.js devtools Chrome extension
- База данных: SQLite GUI (SQLite Expert Personal или DBeaver Community)
- ESLint и EditorConfig должны быть настроены в вашей IDE
