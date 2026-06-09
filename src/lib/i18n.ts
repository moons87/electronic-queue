// Двуязычность RU/KZ для экранов абитуриента (главная, талон, табло).
// Язык хранится в cookie `lang`. Этот файл клиент-безопасен (без next/headers).

export type Lang = "ru" | "kz";

export const dict = {
  ru: {
    admission: "Приёмная комиссия",
    queueTitle: "Электронная очередь",
    homeSubtitle:
      "Выберите направление — получите талон и следите за очередью с телефона.",
    tapToJoin: "Нажмите, чтобы встать в очередь",
    noServices: "Сейчас нет открытых направлений.",

    yourTicket: "Ваш талон",
    ahead: "перед вами",
    waitMinutes: "минут ожидания",
    keepOpen:
      "Держите страницу открытой — мы подадим сигнал, когда подойдёт очередь.",
    enableSound: "Включить звук вызова",
    soundOn: "Звук включён",
    soundHint: "Нажмите один раз, чтобы услышать сигнал при вызове.",
    leave: "Покинуть очередь",
    leaveConfirm: "Покинуть очередь?",
    called: "Вас вызывают",
    comeUp: "Подойдите, пожалуйста",
    serving: "Идёт приём",
    done: "Обслуживание завершено",
    noShow: "Вызов пропущен — подойдите к стойке информации",
    cancelled: "Вы покинули очередь",

    boardSub: "Приёмная комиссия · очередь",
    inviteToWindow: "Приглашаем к окну",
    waitingCalls: "Ожидание вызовов…",
    inQueue: "В очереди",
    noWaiting: "— нет ожидающих",
    noServicesShort: "Нет направлений",
  },
  kz: {
    admission: "Қабылдау комиссиясы",
    queueTitle: "Электрондық кезек",
    homeSubtitle:
      "Бағытты таңдаңыз — талон алып, кезекті телефоннан қадағалаңыз.",
    tapToJoin: "Кезекке тұру үшін басыңыз",
    noServices: "Қазір ашық бағыттар жоқ.",

    yourTicket: "Сіздің талоныңыз",
    ahead: "сізден алдыда",
    waitMinutes: "минут күту",
    keepOpen: "Бетті ашық ұстаңыз — кезек жеткенде белгі береміз.",
    enableSound: "Шақыру дыбысын қосу",
    soundOn: "Дыбыс қосулы",
    soundHint: "Шақыру дыбысын есту үшін бір рет басыңыз.",
    leave: "Кезектен шығу",
    leaveConfirm: "Кезектен шығасыз ба?",
    called: "Сізді шақырып жатыр",
    comeUp: "Жақындаңыз, өтінеміз",
    serving: "Қабылдау жүріп жатыр",
    done: "Қызмет көрсету аяқталды",
    noShow: "Шақыру өткізілді — ақпарат сөресіне жақындаңыз",
    cancelled: "Сіз кезектен шықтыңыз",

    boardSub: "Қабылдау комиссиясы · кезек",
    inviteToWindow: "Терезеге шақырамыз",
    waitingCalls: "Шақыруды күту…",
    inQueue: "Кезекте",
    noWaiting: "— күтушілер жоқ",
    noServicesShort: "Бағыттар жоқ",
  },
} as const;

export type Dict = { [K in keyof (typeof dict)["ru"]]: string };

export function tFor(lang: Lang): Dict {
  return dict[lang] ?? dict.ru;
}

// Чтение языка из cookie на клиенте.
export function readLangCookie(): Lang {
  if (typeof document === "undefined") return "ru";
  const m = document.cookie.match(/(?:^|;\s*)lang=(ru|kz)/);
  return (m?.[1] as Lang) ?? "ru";
}
