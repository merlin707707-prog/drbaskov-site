# drbaskov.ru — сайт врача-психотерапевта

домен 
drbaskov.ru купил 12.07.26 на REG.RU за 169 руб  
до 2027-07-12

Astro-сайт: лендинг + блог из Markdown. Проверен сборкой (Astro 5).


https://github.com/merlin707707-prog/drbaskov-site

## Структура

```
drbaskov-site/
├── src/
│   ├── pages/index.astro      — главная (лендинг)
│   ├── pages/blog/            — список статей и шаблон статьи
│   ├── content/blog/          — ★ СТАТЬИ (.md) — редактируются из Obsidian
│   ├── layouts/Base.astro     — общий каркас (шапка, подвал, SEO)
│   └── styles/global.css      — весь дизайн
├── public/                    — фото, favicon, robots.txt
└── astro.config.mjs
```

## Интеграция с Obsidian

Идея: папка проекта живёт внутри хранилища Obsidian, статьи — обычные заметки.

1. Переместите папку `drbaskov-site` в хранилище, например `ВашVault/70_SITE/drbaskov-site`.
2. Статьи пишите в `src/content/blog/` — Obsidian видит их как обычные заметки.
3. Frontmatter каждой статьи (шаблон для Templater/QuickAdd):

```yaml
---
title: "Заголовок статьи"
description: "1–2 предложения для поисковиков и превью"
date: 2026-07-11
tags: ["схематерапия"]
draft: false        # true = не публиковать
---
```

4. Имя файла = URL статьи: `trevoga-chto-delat.md` → `drbaskov.ru/blog/trevoga-chto-delat/`. Используйте латиницу и дефисы.
5. Публикация: плагин **Obsidian Git** (commit + push по кнопке или автоматически) → Vercel пересобирает сайт за ~1 минуту.

Внутренние ссылки Obsidian `[[так]]` на сайте не работают — используйте обычные `[текст](/blog/slug/)`.

## Первый запуск (один раз)

Нужен Node.js ≥ 18 (nodejs.org).

```bash
cd drbaskov-site
npm install
npm run dev        # локальный просмотр: http://localhost:4321
```

## Деплой на Vercel (бесплатно)

1. Создайте репозиторий на GitHub, запушьте проект (`.gitignore` уже настроен).
2. vercel.com → Add New Project → выберите репозиторий. Astro определится автоматически.
3. Домен: купите `drbaskov.ru` (reg.ru / nic.ru), в Vercel → Settings → Domains добавьте его и пропишите указанные DNS-записи у регистратора.
4. Дальше каждый `git push` = автоматическое обновление сайта.

## Что заменить перед запуском

- `[в квадратных скобках]` и `N` — факты: образование, стаж, цены, адрес.
- `https://t.me/USERNAME` и телефон в `src/pages/index.astro`.
- Фото: положите `photo.jpg` в `public/`, в index.astro раскомментируйте `<img>` в блоке `.portrait`.
- Политика конфиденциальности (`src/pages/privacy.astro`) — обязательна по 152-ФЗ при форме записи.

## После запуска

- Яндекс.Вебмастер + Метрика (счётчик добавить в `Base.astro` перед `</body>`).
- Карточки: Яндекс.Карты, ПроДокторов, СберЗдоровье.
- Статьи под запросы: «схематерапия москва», «врач гипнотерапевт», «юнгианский аналитик москва».






