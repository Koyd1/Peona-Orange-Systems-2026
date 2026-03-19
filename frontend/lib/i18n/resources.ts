import type { Resource } from "i18next";

export const resources = {
  md: {
    translation: {
      common: {
        brand: "Peona",
        languageSwitcher: {
          ariaLabel: "Schimbă limba"
        },
        actions: {
          login: "Autentificare",
          logout: "Ieșire",
          loggingOut: "Se închide sesiunea...",
          admin: "Admin",
          backToChat: "Întoarce-te la chat",
          startConversation: "Începe conversația",
          accessAdmin: "Accesează"
        },
        states: {
          loading: "Se încarcă..."
        }
      },
      home: {
        title: "HR AI Assistant",
        description:
          "Peona îi ajută pe candidați să găsească oportunități de carieră la Orange, răspunde la întrebări despre recrutare și oferă informații utile despre rolurile disponibile.",
        chatCard: {
          title: "Chat cu Peona",
          description:
            "Primește răspunsuri rapide la întrebări legate de posturile disponibile, etapele recrutării, beneficii și viața profesională în companie."
        },
        adminCard: {
          title: "Panou de administrare",
          description:
            "Gestionează baza de cunoștințe, șabloanele de prompturi, vizualizează feedbackul și configurează asistentul AI."
        }
      },
      auth: {
        adminPanelTitle: "Panoul de administrare",
        fields: {
          email: "Email",
          password: "Parolă"
        },
        placeholders: {
          email: "admin@company.com",
          password: "••••••••"
        },
        validation: {
          emailRequired: "Introduceți adresa de email",
          passwordRequired: "Introduceți parola",
          passwordMin: "Parola trebuie să aibă cel puțin 8 caractere"
        },
        errors: {
          credentials: "Email sau parolă incorectă"
        },
        accessibility: {
          showPassword: "Arată parola",
          hidePassword: "Ascunde parola",
          emailIcon: "Pictogramă email",
          passwordIcon: "Pictogramă parolă"
        }
      },
      chat: {
        status: {
          noMessages: "Niciun mesaj.",
          streamError: "Eroare la încărcarea răspunsului."
        },
        welcome: {
          title: "Bine ai venit!",
          subtitle: "Cum te pot ajuta astăzi?",
          faqLabel: "FAQ:"
        },
        greeting: {
          intro:
            "Bună ziua! 👋 Sunt asistentul HR. Vă voi ajuta să găsiți postul vacant potrivit, vă voi explica etapele recrutării și informațiile utile pentru a explora oportunitățile de carieră la Orange.",
          question: "Cu ce vă pot ajuta?"
        },
        promptUpgrade: {
          title: "Îmbunătățește întrebarea",
          badge: "Smart",
          enable: "Activează sugestiile în timp ce scrii",
          disable: "Dezactivează sugestiile în timp ce scrii",
          emptyInput: "Mai întâi scrie întrebarea ta."
        },
        composer: {
          placeholder: "Scrie un mesaj...",
          send: "Trimite mesajul",
          sending: "Se trimite mesajul"
        },
        jumpToLatest: {
          ariaLabel: "Derulează la ultimele mesaje",
          title: "Mesaje noi"
        },
        message: {
          assistantTyping: "Asistentul scrie",
          details: "Detalii",
          noSources: "Nu există surse disponibile pentru acest răspuns.",
          loadingSources: "Se încarcă sursele...",
          loadSourcesFailed: "Nu s-au putut încărca sursele",
          source: "Sursă",
          unknown: "necunoscut",
          similarity: "Similaritate"
        },
        feedback: {
          intro:
            "Cum ți s-a părut experiența? Evaluează conversația și ajută-ne să îmbunătățim asistentul.",
          helpful: "Util",
          notHelpful: "Neutil",
          saving: "Se salvează...",
          commentPlaceholder: "Comentează...",
          submitComment: "Trimite comentariul",
          submitFailed: "Trimiterea feedback-ului a eșuat"
        },
        session: {
          new: "Sesiune nouă",
          modeScreenReader: "Regim sesiune: obișnuit. Expiră la: {{expiresLabel}}",
          unknownExpiry: "necunoscut",
          hintNeedsAnswer: "Trimite un mesaj și așteaptă răspunsul pentru a începe un chat nou",
          hintNewSession: "Încheie sesiunea și începe un chat nou",
          terminateFailed: "Sesiunea nu a putut fi încheiată"
        },
        faq: {
          loadFailed: "Nu s-au putut încărca întrebările FAQ",
          empty: "Nu există întrebări FAQ active."
        },
        prompts: {
          loadFailed: "Nu s-au putut încărca șabloanele de prompt",
          empty: "Nu există șabloane active."
        }
      },
      admin: {
        nav: {
          backToChat: "Înapoi la chat",
          knowledge: "Knowledge Base",
          feedback: "Feedback",
          prompts: "Prompt Templates",
          faq: "FAQ",
          health: "Sănătate"
        },
        health: {
          page: {
            title: "Sănătatea sistemului",
            description:
              "Verifici serviciile critice, costurile AI, distribuția modelelor și riscurile de halucinație, cu refresh automat la 30s."
          },
          panel: {
            title: "Monitor de sănătate",
            subtitle:
              "O vedere compactă pentru starea serviciilor, utilizarea AI, costul modelelor și calitatea răspunsurilor.",
            updated: "Actualizat: {{value}}"
          },
          badge: {
            ok: "OK",
            warn: "AVERTISMENT",
            error: "EROARE",
            unavailable: "N/A"
          },
          common: {
            na: "n/a",
            msValue: "{{value}} ms"
          },
          errors: {
            loadFailed: "Nu s-a putut încărca starea sistemului.",
            loadGeneric: "Eroare la încărcare"
          },
          alerts: {
            exactTelemetryEmpty:
              "Telemetria exactă este goală deoarece nu a fost înregistrat niciun chat nou după activarea telemetriei. Trimite un mesaj nou în chat după repornirea aplicației pentru a popula tokenii exacți, costul exact și utilizarea evaluărilor.",
            missingPricing: "Lipsește prețul pentru: {{models}}"
          },
          services: {
            openai: "OpenAI",
            redis: "Redis",
            database: "Bază de date",
            statusOk: "OK",
            statusFail: "EȘEC",
            latency: "Latență: {{value}} ms",
            model: "Model: {{value}}",
            chunksMessages: "Fragmente: {{chunks}} | Mesaje: {{messages}}"
          },
          usage: {
            snapshotTitle: "Rezumat utilizare",
            snapshotSubtitle: "Rezumat 24h + 30d",
            stats: {
              tokens24h: "Tokeni 24h",
              requests: "{{count}} cereri",
              spend30d: "Cost 30d",
              totalTokens: "{{count}} tokeni în total",
              coverage: "Acoperire",
              messages: "{{withExact}} / {{total}} mesaje",
              judged: "Evaluat",
              judgedAnswers: "{{count}} răspunsuri evaluate"
            },
            tokenTrend: {
              title: "Evoluție tokeni",
              subtitle: "Volumul de tokeni în ultimele 30 de zile",
              series: {
                tokens: "Tokeni"
              }
            },
            windowTable: {
              headers: {
                window: "Fereastră",
                tokens: "Tokeni",
                avgRisk: "Risc mediu",
                judged: "Evaluat",
                needsReview: "Necesită revizuire"
              }
            },
            modelBreakdown: {
              title: "Defalcare pe model",
              table: {
                headers: {
                  model: "Model",
                  operation: "Operație",
                  tokens: "Tokeni",
                  spend: "Cost",
                  latency: "Latență"
                },
                pricingGap: "preț lipsă",
                noData: "Nu există utilizare pe modele încă."
              }
            }
          },
          quality: {
            snapshotTitle: "Rezumat calitate",
            snapshotSubtitle: "Focus 30d",
            stats: {
              averageRisk: "Risc mediu",
              p95Hint: "p95 {{value}}",
              judgedCoverage: "Acoperire evaluări",
              judgedAnswersHint: "{{count}} răspunsuri evaluate",
              needsReview: "Necesită revizuire",
              needsReviewHint: "răspunsuri cu scor >= 0.85",
              latestHighScore: "Cel mai recent scor ridicat",
              latestHint: "un singur răspuns; graficul arată agregări zilnice",
              latestEmpty: "nu există răspunsuri recente care necesită revizuire"
            },
            trend: {
              title: "Evoluție risc suport",
              subtitle: "Scor mediu și p95 al riscului de suport pe zile",
              series: {
                average: "Mediu",
                p95: "P95"
              }
            },
            interpretation: {
              title: "Interpretare și motive frecvente",
              point1: "Acesta este un scor al riscului de suport, nu un scor al adevărului.",
              point2:
                "Valorile mai mari înseamnă că răspunsul se bazează mai mult pe suport slab sau lipsă în contextul recuperat.",
              point3:
                "Un scor de 0.8 poate fi încă un avertisment strict de grounding, nu neapărat o halucinație reală."
            },
            reasonCount: "× {{count}}",
            reasonsEmpty: "Nu există încă motive de evaluare.",
            riskyTable: {
              headers: {
                date: "Data",
                model: "Model",
                score: "Scor",
                reason: "Motiv",
                feedback: "Feedback",
                excerpt: "Fragment"
              },
              empty: "Nu s-au găsit răspunsuri care necesită revizuire în ultimele 30 de zile."
            }
          }
        },
        knowledge: {
          title: "Knowledge Base",
          description: "Gestionarea fișierelor și documentelor pentru asistentul AI.",
          uploadButton: "Încarcă fișierul",
          searchPlaceholder: "Caută",
          searchAriaLabel: "Caută fișiere",
          loadFailed: "Nu s-a putut încărca lista fișierelor",
          deleteFailed: "Ștergerea a eșuat",
          downloadFailed: "Descărcarea a eșuat",
          reindexFailed: "Reindexarea a eșuat"
        },
        fileUpload: {
          title: "Încarcă document",
          description:
            "Formate: PDF, DOCX, TXT, MD, PNG, JPG, WEBP. Dimensiune maximă: {{size}} MB.",
          unsupported: "Sunt acceptate doar fișiere PDF, DOCX, TXT, MD.",
          fileTooLarge: "Fișierul depășește limita de {{size}} MB.",
          uploadFailed: "Încărcarea a eșuat",
          uploaded: "Fișierul {{name}} a fost încărcat.",
          buttonUploading: "Se încarcă...",
          footer:
            "După încărcare, documentul va intra automat în pipeline-ul de indexare."
        },
        fileTable: {
          title: "Fișiere încărcate",
          countOne: "1 fișier în baza de cunoștințe",
          countOther: "{{count}} fișiere în baza de cunoștințe",
          refreshing: "Actualizare...",
          sortBy: "Sortează după:",
          newest: "Noi",
          oldest: "Vechi",
          columns: {
            name: "Denumire",
            size: "Mărimea fișierului",
            uploadedAt: "Data încărcării",
            status: "Statut",
            chunks: "Chunks",
            actions: "Acțiuni"
          },
          status: {
            pending: "În așteptare",
            processing: "În procesare",
            ready: "Finalizat",
            error: "Eroare"
          },
          openActions: "Deschide acțiunile",
          actions: {
            reindex: "Reindex",
            save: "Salvează",
            delete: "Șterge"
          },
          confirmDelete: "Ștergi {{name}} și toate chunk-urile indexate?",
          emptyTitle: "Nu există fișiere pentru filtrele selectate.",
          emptyDescription:
            "Încarcă un document nou sau schimbă căutarea/sortarea pentru a vedea rezultate."
        },
        feedback: {
          title: "Feedback",
          description: "Recenziile utilizatorilor despre funcționarea asistentului AI",
          refresh: "Refresh",
          exportCsv: "Exportă CSV",
          loadFailed: "Nu s-au putut încărca analizele de feedback",
          negativeTitle: "Feedback negativ",
          negativeDescription: "Mesajele care au primit evaluări negative în conversațiile recente.",
          columns: {
            date: "Date",
            user: "User",
            comment: "Comment",
            message: "Message",
            session: "Session"
          },
          emptyTitle: "Nu există feedback negativ",
          emptyDescription: "Utilizatorii au oferit până acum feedback pozitiv.",
          pagination: {
            showing: "Afișare {{from}}-{{to}} din {{total}}",
            previous: "Previous",
            next: "Next",
            page: "Pagina {{page}} / {{totalPages}}"
          }
        },
        feedbackChart: {
          empty: "Nu există încă date pentru grafic.",
          cards: {
            totalReviews: "Total recenzii",
            positive: "Pozitive",
            negative: "Negative",
            comments: "Comentarii"
          },
          lines: {
            positivePercent: "Pozitive %",
            negativePercent: "Negative %",
            positive: "Pozitive",
            negative: "Negative"
          },
          statsTitle: "Statistici",
          statsDescription: "% din recenzii pe zi",
          histogramTitle: "Histogramă",
          histogramDescription: "Număr de recenzii pe zi"
        },
        prompts: {
          title: "Prompt Templates",
          description: "Gestionarea șabloanelor de prompturi pentru asistentul AI.",
          loadFailed: "Nu s-au putut încărca șabloanele de prompt",
          createFailed: "Crearea template-ului a eșuat.",
          updateFailed: "Actualizarea template-ului a eșuat.",
          deleteFailed: "Ștergerea a eșuat",
          invalidPayload:
            "Datele introduse nu sunt valide. Verifică titlul, conținutul, categoria și poziția.",
          refresh: "Actualizare...",
          hideForm: "Ascunde formularul",
          createTemplate: "Creare template",
          newTitle: "Template nou",
          fields: {
            title: "Titlu",
            category: "Categorie",
            content: "Conținut",
            order: "Ordine",
            active: "Activ"
          },
          create: "Creare",
          cancel: "Anulează",
          editTitle: "Editează template-ul",
          editDescription: "Editează rapid template-ul direct din pagină.",
          save: "Salvează",
          saving: "Se salvează...",
          saveChanges: "Salvează modificările",
          subtitleFallback: "Șablon reutilizabil pentru asistentul AI",
          categoryPrefix: "Categorie: {{category}}",
          actions: {
            edit: "Editează",
            deactivate: "Dezactivează",
            activate: "Activează",
            delete: "Șterge"
          },
          general: "General",
          emptyTitle: "Nu există template-uri definite.",
          emptyDescription: "Creează primul template din butonul „Creare template”.",
          confirmDelete: "Ștergi acest template?"
        },
        faq: {
          title: "FAQ",
          description: "Gestionarea întrebărilor frecvente pentru asistentul AI.",
          loadFailed: "Nu s-au putut încărca elementele FAQ",
          createFailed: "Crearea FAQ-ului a eșuat.",
          updateFailed: "Actualizarea FAQ-ului a eșuat.",
          deleteFailed: "Ștergerea a eșuat",
          invalidPayload:
            "Datele introduse nu sunt valide. Verifică întrebarea, răspunsul, categoria și ordinea.",
          refresh: "Actualizare...",
          hideForm: "Ascunde formularul",
          createFaq: "Creare FAQ",
          newTitle: "Element FAQ nou",
          fields: {
            question: "Întrebare",
            answer: "Răspuns",
            category: "Categorie",
            order: "Ordine",
            active: "Activ"
          },
          create: "Creează",
          creating: "Se creează...",
          cancel: "Anulează",
          editTitle: "Editează FAQ",
          editDescription: "Editează rapid conținutul fără să ieși din pagină.",
          save: "Salvează",
          saving: "Se salvează...",
          subtitleFallback: "Întrebări frecvente pentru asistent",
          categoryPrefix: "Categorie: {{category}}",
          empty: "Nu există elemente FAQ.",
          orderBadge: "Ordine: {{order}}",
          activeBadge: "Activ",
          inactiveBadge: "Inactiv",
          updatedAt: "Actualizat: {{date}}",
          actions: "Acțiuni",
          edit: "Editează",
          deactivate: "Dezactivează",
          activate: "Activează",
          deleting: "Se șterge...",
          delete: "Șterge",
          confirmDelete: "Ștergi acest element FAQ?"
        }
      }
    }
  },
  ru: {
    translation: {
      common: {
        brand: "Peona",
        languageSwitcher: {
          ariaLabel: "Сменить язык"
        },
        actions: {
          login: "Войти",
          logout: "Выйти",
          loggingOut: "Выход из системы...",
          admin: "Админ",
          backToChat: "Вернуться в чат",
          startConversation: "Начать разговор",
          accessAdmin: "Войти в админ-панель"
        },
        states: {
          loading: "Загрузка..."
        }
      },
      home: {
        title: "HR AI Assistant",
        description:
          "Peona помогает кандидатам находить карьерные возможности в Orange, отвечает на вопросы о найме и дает полезную информацию о доступных ролях.",
        chatCard: {
          title: "Чат с Peona",
          description:
            "Получайте быстрые ответы на вопросы о вакансиях, этапах найма, бенефитах и профессиональной жизни в компании."
        },
        adminCard: {
          title: "Админ-панель",
          description:
            "Управляйте базой знаний, шаблонами промптов, просматривайте обратную связь и настраивайте AI-ассистента."
        }
      },
      auth: {
        adminPanelTitle: "Панель администрирования",
        fields: {
          email: "Email",
          password: "Пароль"
        },
        placeholders: {
          email: "admin@company.com",
          password: "••••••••"
        },
        validation: {
          emailRequired: "Введите адрес электронной почты",
          passwordRequired: "Введите пароль",
          passwordMin: "Пароль должен содержать не менее 8 символов"
        },
        errors: {
          credentials: "Неверный email или пароль"
        },
        accessibility: {
          showPassword: "Показать пароль",
          hidePassword: "Скрыть пароль",
          emailIcon: "Иконка email",
          passwordIcon: "Иконка пароля"
        }
      },
      chat: {
        status: {
          noMessages: "Сообщений нет.",
          streamError: "Не удалось загрузить ответ."
        },
        welcome: {
          title: "Добро пожаловать!",
          subtitle: "Чем я могу помочь сегодня?",
          faqLabel: "FAQ:"
        },
        greeting: {
          intro:
            "Здравствуйте! 👋 Я HR-ассистент. Я помогу вам найти подходящую вакансию, объясню этапы найма и полезную информацию о карьерных возможностях в Orange.",
          question: "Чем я могу помочь?"
        },
        promptUpgrade: {
          title: "Улучшите запрос",
          badge: "Smart",
          enable: "Включить подсказки во время ввода",
          disable: "Отключить подсказки во время ввода",
          emptyInput: "Сначала напишите ваш вопрос."
        },
        composer: {
          placeholder: "Напишите сообщение...",
          send: "Отправить сообщение",
          sending: "Сообщение отправляется"
        },
        jumpToLatest: {
          ariaLabel: "Прокрутить к последним сообщениям",
          title: "Новые сообщения"
        },
        message: {
          assistantTyping: "Ассистент печатает",
          details: "Детали",
          noSources: "Для этого ответа нет доступных источников.",
          loadingSources: "Источники загружаются...",
          loadSourcesFailed: "Не удалось загрузить источники",
          source: "Источник",
          unknown: "неизвестно",
          similarity: "Сходство"
        },
        feedback: {
          intro:
            "Как вам опыт? Оцените разговор и помогите нам улучшить ассистента.",
          helpful: "Полезно",
          notHelpful: "Не полезно",
          saving: "Сохраняется...",
          commentPlaceholder: "Добавьте комментарий...",
          submitComment: "Отправить комментарий",
          submitFailed: "Не удалось отправить отзыв"
        },
        session: {
          new: "Новая сессия",
          modeScreenReader: "Режим сессии: обычный. Истекает: {{expiresLabel}}",
          unknownExpiry: "неизвестно",
          hintNeedsAnswer: "Отправьте сообщение и дождитесь ответа, чтобы начать новый чат",
          hintNewSession: "Завершить сессию и начать новый чат",
          terminateFailed: "Не удалось завершить сессию"
        },
        faq: {
          loadFailed: "Не удалось загрузить FAQ",
          empty: "Нет активных FAQ."
        },
        prompts: {
          loadFailed: "Не удалось загрузить шаблоны промптов",
          empty: "Нет активных шаблонов."
        }
      },
      admin: {
        nav: {
          backToChat: "Назад в чат",
          knowledge: "База знаний",
          feedback: "Отзывы",
          prompts: "Шаблоны промптов",
          faq: "FAQ",
          health: "Состояние"
        },
        health: {
          page: {
            title: "Состояние системы",
            description:
              "Проверяйте критические сервисы, затраты на AI, распределение моделей и риски галлюцинаций с автообновлением каждые 30 секунд."
          },
          panel: {
            title: "Мониторинг состояния",
            subtitle:
              "Компактный обзор статуса сервисов, использования AI, затрат по моделям и качества ответов.",
            updated: "Обновлено: {{value}}"
          },
          badge: {
            ok: "OK",
            warn: "ВНИМАНИЕ",
            error: "ОШИБКА",
            unavailable: "Н/Д"
          },
          common: {
            na: "н/д",
            msValue: "{{value}} мс"
          },
          errors: {
            loadFailed: "Не удалось загрузить данные о состоянии системы.",
            loadGeneric: "Ошибка загрузки"
          },
          alerts: {
            exactTelemetryEmpty:
              "Точная телеметрия пуста, потому что после включения телеметрии не было новых чатов. Отправьте новое сообщение в чате после перезапуска приложения, чтобы заполнить точные токены, точные расходы и данные оценки.",
            missingPricing: "Нет цен для: {{models}}"
          },
          services: {
            openai: "OpenAI",
            redis: "Redis",
            database: "База данных",
            statusOk: "OK",
            statusFail: "СБОЙ",
            latency: "Задержка: {{value}} мс",
            model: "Модель: {{value}}",
            chunksMessages: "Чанки: {{chunks}} | Сообщения: {{messages}}"
          },
          usage: {
            snapshotTitle: "Сводка использования",
            snapshotSubtitle: "Сводка за 24ч + 30д",
            stats: {
              tokens24h: "Токены 24ч",
              requests: "{{count}} запросов",
              spend30d: "Расход 30д",
              totalTokens: "{{count}} токенов всего",
              coverage: "Покрытие",
              messages: "{{withExact}} / {{total}} сообщений",
              judged: "Оценено",
              judgedAnswers: "{{count}} оценённых ответов"
            },
            tokenTrend: {
              title: "Тренд токенов",
              subtitle: "Объём токенов за последние 30 дней",
              series: {
                tokens: "Токены"
              }
            },
            windowTable: {
              headers: {
                window: "Период",
                tokens: "Токены",
                avgRisk: "Средний риск",
                judged: "Оценено",
                needsReview: "Нужна проверка"
              }
            },
            modelBreakdown: {
              title: "Разбивка по моделям",
              table: {
                headers: {
                  model: "Модель",
                  operation: "Операция",
                  tokens: "Токены",
                  spend: "Расход",
                  latency: "Задержка"
                },
                pricingGap: "нет цены",
                noData: "Пока нет использования моделей."
              }
            }
          },
          quality: {
            snapshotTitle: "Сводка качества",
            snapshotSubtitle: "Фокус 30д",
            stats: {
              averageRisk: "Средний риск",
              p95Hint: "p95 {{value}}",
              judgedCoverage: "Покрытие оценок",
              judgedAnswersHint: "{{count}} оценённых ответов",
              needsReview: "Нужна проверка",
              needsReviewHint: "ответы со счётом >= 0.85",
              latestHighScore: "Последний высокий счёт",
              latestHint: "один ответ; график показывает дневные агрегаты",
              latestEmpty: "нет недавних ответов, требующих проверки"
            },
            trend: {
              title: "Тренд риска поддержки",
              subtitle: "Средний и p95 риск поддержки по дням",
              series: {
                average: "Средний",
                p95: "P95"
              }
            },
            interpretation: {
              title: "Интерпретация и частые причины",
              point1: "Это оценка риска поддержки, а не истинности.",
              point2:
                "Более высокие значения означают, что ответ больше опирается на слабую или отсутствующую поддержку в извлечённом контексте.",
              point3:
                "Оценка 0.8 может быть строгим предупреждением о слабом grounding, а не обязательно реальной галлюцинацией."
            },
            reasonCount: "× {{count}}",
            reasonsEmpty: "Пока нет причин оценок.",
            riskyTable: {
              headers: {
                date: "Дата",
                model: "Модель",
                score: "Оценка",
                reason: "Причина",
                feedback: "Отзыв",
                excerpt: "Фрагмент"
              },
              empty: "За последние 30 дней не найдено ответов, требующих проверки."
            }
          }
        },
        knowledge: {
          title: "База знаний",
          description: "Управление файлами и документами для AI-ассистента.",
          uploadButton: "Загрузить файл",
          searchPlaceholder: "Поиск",
          searchAriaLabel: "Поиск файлов",
          loadFailed: "Не удалось загрузить список файлов",
          deleteFailed: "Не удалось удалить файл",
          downloadFailed: "Не удалось скачать файл",
          reindexFailed: "Не удалось переиндексировать файл"
        },
        fileUpload: {
          title: "Загрузить документ",
          description:
            "Форматы: PDF, DOCX, TXT, MD, PNG, JPG, WEBP. Максимальный размер: {{size}} МБ.",
          unsupported: "Поддерживаются только PDF, DOCX, TXT и MD.",
          fileTooLarge: "Файл превышает лимит {{size}} МБ.",
          uploadFailed: "Загрузка не удалась",
          uploaded: "Файл {{name}} загружен.",
          buttonUploading: "Загрузка...",
          footer:
            "После загрузки документ автоматически попадет в пайплайн индексации."
        },
        fileTable: {
          title: "Загруженные файлы",
          countOne: "1 файл в базе знаний",
          countOther: "{{count}} файлов в базе знаний",
          refreshing: "Обновление...",
          sortBy: "Сортировать по:",
          newest: "Новые",
          oldest: "Старые",
          columns: {
            name: "Название",
            size: "Размер файла",
            uploadedAt: "Дата загрузки",
            status: "Статус",
            chunks: "Chunks",
            actions: "Действия"
          },
          status: {
            pending: "В ожидании",
            processing: "В обработке",
            ready: "Готово",
            error: "Ошибка"
          },
          openActions: "Открыть действия",
          actions: {
            reindex: "Переиндексировать",
            save: "Сохранить",
            delete: "Удалить"
          },
          confirmDelete: "Удалить {{name}} и все индексированные чанки?",
          emptyTitle: "Нет файлов для выбранных фильтров.",
          emptyDescription:
            "Загрузите новый документ или измените поиск/сортировку, чтобы увидеть результаты."
        },
        feedback: {
          title: "Отзывы",
          description: "Отзывы пользователей о работе AI-ассистента",
          refresh: "Обновить",
          exportCsv: "Экспорт CSV",
          loadFailed: "Не удалось загрузить аналитику отзывов",
          negativeTitle: "Негативные отзывы",
          negativeDescription: "Сообщения, получившие отрицательную оценку в недавних разговорах.",
          columns: {
            date: "Дата",
            user: "Пользователь",
            comment: "Комментарий",
            message: "Сообщение",
            session: "Сессия"
          },
          emptyTitle: "Негативных отзывов нет",
          emptyDescription: "Пока пользователи оставляли только положительные отзывы.",
          pagination: {
            showing: "Показано {{from}}-{{to}} из {{total}}",
            previous: "Назад",
            next: "Вперед",
            page: "Страница {{page}} / {{totalPages}}"
          }
        },
        feedbackChart: {
          empty: "Для графика пока нет данных.",
          cards: {
            totalReviews: "Всего отзывов",
            positive: "Позитивные",
            negative: "Негативные",
            comments: "Комментарии"
          },
          lines: {
            positivePercent: "Позитивные %",
            negativePercent: "Негативные %",
            positive: "Позитивные",
            negative: "Негативные"
          },
          statsTitle: "Статистика",
          statsDescription: "% отзывов по дням",
          histogramTitle: "Гистограмма",
          histogramDescription: "Количество отзывов по дням"
        },
        prompts: {
          title: "Шаблоны промптов",
          description: "Управление шаблонами промптов для AI-ассистента.",
          loadFailed: "Не удалось загрузить шаблоны промптов",
          createFailed: "Не удалось создать шаблон.",
          updateFailed: "Не удалось обновить шаблон.",
          deleteFailed: "Удаление не удалось",
          invalidPayload:
            "Введенные данные некорректны. Проверьте заголовок, содержимое, категорию и порядок.",
          refresh: "Обновление...",
          hideForm: "Скрыть форму",
          createTemplate: "Создать шаблон",
          newTitle: "Новый шаблон",
          fields: {
            title: "Заголовок",
            category: "Категория",
            content: "Содержимое",
            order: "Порядок",
            active: "Активен"
          },
          create: "Создать",
          cancel: "Отмена",
          editTitle: "Редактировать шаблон",
          editDescription: "Быстро отредактируйте шаблон прямо на странице.",
          save: "Сохранить",
          saving: "Сохранение...",
          saveChanges: "Сохранить изменения",
          subtitleFallback: "Переиспользуемый шаблон для AI-ассистента",
          categoryPrefix: "Категория: {{category}}",
          actions: {
            edit: "Редактировать",
            deactivate: "Деактивировать",
            activate: "Активировать",
            delete: "Удалить"
          },
          general: "Общее",
          emptyTitle: "Шаблоны еще не созданы.",
          emptyDescription: "Создайте первый шаблон кнопкой «Создать шаблон».",
          confirmDelete: "Удалить этот шаблон?"
        },
        faq: {
          title: "FAQ",
          description: "Управление часто задаваемыми вопросами для AI-ассистента.",
          loadFailed: "Не удалось загрузить элементы FAQ",
          createFailed: "Не удалось создать FAQ.",
          updateFailed: "Не удалось обновить FAQ.",
          deleteFailed: "Удаление не удалось",
          invalidPayload:
            "Введенные данные некорректны. Проверьте вопрос, ответ, категорию и порядок.",
          refresh: "Обновление...",
          hideForm: "Скрыть форму",
          createFaq: "Создать FAQ",
          newTitle: "Новый элемент FAQ",
          fields: {
            question: "Вопрос",
            answer: "Ответ",
            category: "Категория",
            order: "Порядок",
            active: "Активен"
          },
          create: "Создать",
          creating: "Создание...",
          cancel: "Отмена",
          editTitle: "Редактировать FAQ",
          editDescription: "Быстро редактируйте содержимое, не покидая страницу.",
          save: "Сохранить",
          saving: "Сохранение...",
          subtitleFallback: "Частые вопросы для ассистента",
          categoryPrefix: "Категория: {{category}}",
          empty: "Элементов FAQ нет.",
          orderBadge: "Порядок: {{order}}",
          activeBadge: "Активен",
          inactiveBadge: "Неактивен",
          updatedAt: "Обновлено: {{date}}",
          actions: "Действия",
          edit: "Редактировать",
          deactivate: "Деактивировать",
          activate: "Активировать",
          deleting: "Удаление...",
          delete: "Удалить",
          confirmDelete: "Удалить этот элемент FAQ?"
        }
      }
    }
  },
  en: {
    translation: {
      common: {
        brand: "Peona",
        languageSwitcher: {
          ariaLabel: "Change language"
        },
        actions: {
          login: "Log in",
          logout: "Log out",
          loggingOut: "Logging out...",
          admin: "Admin",
          backToChat: "Back to chat",
          startConversation: "Start conversation",
          accessAdmin: "Access Admin"
        },
        states: {
          loading: "Loading..."
        }
      },
      home: {
        title: "HR AI Assistant",
        description:
          "Peona helps candidates discover career opportunities at Orange, answers recruitment questions, and provides useful information about available roles.",
        chatCard: {
          title: "Chat with Peona",
          description:
            "Get quick answers about open roles, recruitment steps, benefits, and professional life at the company."
        },
        adminCard: {
          title: "Admin Panel",
          description:
            "Manage the knowledge base, prompt templates, review feedback, and configure the AI assistant."
        }
      },
      auth: {
        adminPanelTitle: "Administration panel",
        fields: {
          email: "Email",
          password: "Password"
        },
        placeholders: {
          email: "admin@company.com",
          password: "••••••••"
        },
        validation: {
          emailRequired: "Enter your email address",
          passwordRequired: "Enter your password",
          passwordMin: "Password must be at least 8 characters"
        },
        errors: {
          credentials: "Incorrect email or password"
        },
        accessibility: {
          showPassword: "Show password",
          hidePassword: "Hide password",
          emailIcon: "Email icon",
          passwordIcon: "Password icon"
        }
      },
      chat: {
        status: {
          noMessages: "No messages.",
          streamError: "Failed to load the response."
        },
        welcome: {
          title: "Welcome!",
          subtitle: "How can I help you today?",
          faqLabel: "FAQ:"
        },
        greeting: {
          intro:
            "Hello! 👋 I am the HR assistant. I will help you find a suitable vacancy, explain the recruitment stages, and share useful information about career opportunities at Orange.",
          question: "How can I help you?"
        },
        promptUpgrade: {
          title: "Upgrade your prompt",
          badge: "Smart",
          enable: "Enable suggestions while typing",
          disable: "Disable suggestions while typing",
          emptyInput: "Write your question first."
        },
        composer: {
          placeholder: "Write a message...",
          send: "Send message",
          sending: "Sending message"
        },
        jumpToLatest: {
          ariaLabel: "Scroll to latest messages",
          title: "New messages"
        },
        message: {
          assistantTyping: "Assistant is typing",
          details: "Details",
          noSources: "No sources are available for this answer.",
          loadingSources: "Loading sources...",
          loadSourcesFailed: "Failed to load sources",
          source: "Source",
          unknown: "unknown",
          similarity: "Similarity"
        },
        feedback: {
          intro:
            "How was your experience? Rate the conversation and help us improve the assistant.",
          helpful: "Helpful",
          notHelpful: "Not helpful",
          saving: "Saving...",
          commentPlaceholder: "Add a comment...",
          submitComment: "Send comment",
          submitFailed: "Failed to submit feedback"
        },
        session: {
          new: "New session",
          modeScreenReader: "Session mode: regular. Expires at: {{expiresLabel}}",
          unknownExpiry: "unknown",
          hintNeedsAnswer: "Send a message and wait for the answer to start a new chat",
          hintNewSession: "End the session and start a new chat",
          terminateFailed: "Failed to terminate the session"
        },
        faq: {
          loadFailed: "Failed to load FAQ items",
          empty: "No active FAQ items."
        },
        prompts: {
          loadFailed: "Failed to load prompt templates",
          empty: "No active templates."
        }
      },
      admin: {
        nav: {
          backToChat: "Back to chat",
          knowledge: "Knowledge Base",
          feedback: "Feedback",
          prompts: "Prompt Templates",
          faq: "FAQ",
          health: "Health"
        },
        health: {
          page: {
            title: "System Health",
            description:
              "Check critical services, AI costs, model distribution, and hallucination risk, with an automatic 30s refresh."
          },
          panel: {
            title: "Health monitor",
            subtitle:
              "One compact view for service status, AI usage, model spend, and answer quality.",
            updated: "Updated: {{value}}"
          },
          badge: {
            ok: "OK",
            warn: "WARN",
            error: "ERROR",
            unavailable: "N/A"
          },
          common: {
            na: "n/a",
            msValue: "{{value}} ms"
          },
          errors: {
            loadFailed: "Failed to load health payload",
            loadGeneric: "Load error"
          },
          alerts: {
            exactTelemetryEmpty:
              "Exact telemetry is empty because no new chat has been recorded after the telemetry rollout yet. Send a new message in chat after restarting the app to populate exact tokens, exact spend, and judge usage.",
            missingPricing: "Missing pricing for: {{models}}"
          },
          services: {
            openai: "OpenAI",
            redis: "Redis",
            database: "Database",
            statusOk: "OK",
            statusFail: "FAIL",
            latency: "Latency: {{value}} ms",
            model: "Model: {{value}}",
            chunksMessages: "Chunks: {{chunks}} | Messages: {{messages}}"
          },
          usage: {
            snapshotTitle: "Usage snapshot",
            snapshotSubtitle: "24h + 30d summary",
            stats: {
              tokens24h: "Tokens 24h",
              requests: "{{count}} requests",
              spend30d: "Spend 30d",
              totalTokens: "{{count}} total tokens",
              coverage: "Coverage",
              messages: "{{withExact}} / {{total}} messages",
              judged: "Judged",
              judgedAnswers: "{{count}} judged answers"
            },
            tokenTrend: {
              title: "Token trend",
              subtitle: "Token volume over the last 30 days",
              series: {
                tokens: "Tokens"
              }
            },
            windowTable: {
              headers: {
                window: "Window",
                tokens: "Tokens",
                avgRisk: "Avg risk",
                judged: "Judged",
                needsReview: "Needs review"
              }
            },
            modelBreakdown: {
              title: "Model breakdown",
              table: {
                headers: {
                  model: "Model",
                  operation: "Operation",
                  tokens: "Tokens",
                  spend: "Spend",
                  latency: "Latency"
                },
                pricingGap: "pricing gap",
                noData: "No model usage yet."
              }
            }
          },
          quality: {
            snapshotTitle: "Quality snapshot",
            snapshotSubtitle: "30d focus",
            stats: {
              averageRisk: "Average risk",
              p95Hint: "p95 {{value}}",
              judgedCoverage: "Judged coverage",
              judgedAnswersHint: "{{count}} judged answers",
              needsReview: "Needs review",
              needsReviewHint: "answers with score >= 0.85",
              latestHighScore: "Latest high score",
              latestHint: "single answer; chart shows daily aggregates",
              latestEmpty: "no recent review-worthy answer"
            },
            trend: {
              title: "Support-risk trend",
              subtitle: "Average and p95 support-risk score by day",
              series: {
                average: "Average",
                p95: "P95"
              }
            },
            interpretation: {
              title: "Interpretation and common reasons",
              point1: "This is a support-risk score, not a truth score.",
              point2:
                "Higher values mean the answer relies more on weak or missing support in retrieved context.",
              point3:
                "A score like 0.8 can still be a strict grounding warning, not necessarily a true hallucination."
            },
            reasonCount: "× {{count}}",
            reasonsEmpty: "No judge reasons yet.",
            riskyTable: {
              headers: {
                date: "Date",
                model: "Model",
                score: "Score",
                reason: "Reason",
                feedback: "Feedback",
                excerpt: "Excerpt"
              },
              empty: "No review-worthy answers found in the last 30 days."
            }
          }
        },
        knowledge: {
          title: "Knowledge Base",
          description: "Manage files and documents for the AI assistant.",
          uploadButton: "Upload file",
          searchPlaceholder: "Search",
          searchAriaLabel: "Search files",
          loadFailed: "Failed to load the file list",
          deleteFailed: "Delete failed",
          downloadFailed: "Download failed",
          reindexFailed: "Re-index failed"
        },
        fileUpload: {
          title: "Upload document",
          description:
            "Formats: PDF, DOCX, TXT, MD, PNG, JPG, WEBP. Maximum size: {{size}} MB.",
          unsupported: "Only PDF, DOCX, TXT, and MD files are supported.",
          fileTooLarge: "The file exceeds the {{size}} MB limit.",
          uploadFailed: "Upload failed",
          uploaded: "File {{name}} was uploaded.",
          buttonUploading: "Uploading...",
          footer: "After upload, the document will automatically enter the indexing pipeline."
        },
        fileTable: {
          title: "Uploaded files",
          countOne: "1 file in the knowledge base",
          countOther: "{{count}} files in the knowledge base",
          refreshing: "Refreshing...",
          sortBy: "Sort by:",
          newest: "Newest",
          oldest: "Oldest",
          columns: {
            name: "Name",
            size: "File size",
            uploadedAt: "Upload date",
            status: "Status",
            chunks: "Chunks",
            actions: "Actions"
          },
          status: {
            pending: "Pending",
            processing: "Processing",
            ready: "Ready",
            error: "Error"
          },
          openActions: "Open actions",
          actions: {
            reindex: "Re-index",
            save: "Save",
            delete: "Delete"
          },
          confirmDelete: "Delete {{name}} and all indexed chunks?",
          emptyTitle: "No files match the selected filters.",
          emptyDescription:
            "Upload a new document or change the search/sort settings to see results."
        },
        feedback: {
          title: "Feedback",
          description: "User reviews about how the AI assistant performs",
          refresh: "Refresh",
          exportCsv: "Export CSV",
          loadFailed: "Failed to load feedback analytics",
          negativeTitle: "Negative feedback",
          negativeDescription: "Messages that received negative ratings in recent conversations.",
          columns: {
            date: "Date",
            user: "User",
            comment: "Comment",
            message: "Message",
            session: "Session"
          },
          emptyTitle: "No negative feedback",
          emptyDescription: "Users have only provided positive feedback so far.",
          pagination: {
            showing: "Showing {{from}}-{{to}} of {{total}}",
            previous: "Previous",
            next: "Next",
            page: "Page {{page}} / {{totalPages}}"
          }
        },
        feedbackChart: {
          empty: "There is no chart data yet.",
          cards: {
            totalReviews: "Total reviews",
            positive: "Positive",
            negative: "Negative",
            comments: "Comments"
          },
          lines: {
            positivePercent: "Positive %",
            negativePercent: "Negative %",
            positive: "Positive",
            negative: "Negative"
          },
          statsTitle: "Statistics",
          statsDescription: "% of reviews per day",
          histogramTitle: "Histogram",
          histogramDescription: "Number of reviews per day"
        },
        prompts: {
          title: "Prompt Templates",
          description: "Manage prompt templates for the AI assistant.",
          loadFailed: "Failed to load prompt templates",
          createFailed: "Failed to create the template.",
          updateFailed: "Failed to update the template.",
          deleteFailed: "Delete failed",
          invalidPayload:
            "The provided data is invalid. Check the title, content, category, and order.",
          refresh: "Refreshing...",
          hideForm: "Hide form",
          createTemplate: "Create template",
          newTitle: "New template",
          fields: {
            title: "Title",
            category: "Category",
            content: "Content",
            order: "Order",
            active: "Active"
          },
          create: "Create",
          cancel: "Cancel",
          editTitle: "Edit template",
          editDescription: "Quickly edit the template directly on the page.",
          save: "Save",
          saving: "Saving...",
          saveChanges: "Save changes",
          subtitleFallback: "Reusable template for the AI assistant",
          categoryPrefix: "Category: {{category}}",
          actions: {
            edit: "Edit",
            deactivate: "Deactivate",
            activate: "Activate",
            delete: "Delete"
          },
          general: "General",
          emptyTitle: "No templates are defined.",
          emptyDescription: "Create the first template using the “Create template” button.",
          confirmDelete: "Delete this template?"
        },
        faq: {
          title: "FAQ",
          description: "Manage frequently asked questions for the AI assistant.",
          loadFailed: "Failed to load FAQ items",
          createFailed: "Failed to create the FAQ item.",
          updateFailed: "Failed to update the FAQ item.",
          deleteFailed: "Delete failed",
          invalidPayload:
            "The provided data is invalid. Check the question, answer, category, and order.",
          refresh: "Refreshing...",
          hideForm: "Hide form",
          createFaq: "Create FAQ",
          newTitle: "New FAQ item",
          fields: {
            question: "Question",
            answer: "Answer",
            category: "Category",
            order: "Order",
            active: "Active"
          },
          create: "Create",
          creating: "Creating...",
          cancel: "Cancel",
          editTitle: "Edit FAQ",
          editDescription: "Quickly edit content without leaving the page.",
          save: "Save",
          saving: "Saving...",
          subtitleFallback: "Frequently asked questions for the assistant",
          categoryPrefix: "Category: {{category}}",
          empty: "There are no FAQ items.",
          orderBadge: "Order: {{order}}",
          activeBadge: "Active",
          inactiveBadge: "Inactive",
          updatedAt: "Updated: {{date}}",
          actions: "Actions",
          edit: "Edit",
          deactivate: "Deactivate",
          activate: "Activate",
          deleting: "Deleting...",
          delete: "Delete",
          confirmDelete: "Delete this FAQ item?"
        }
      }
    }
  }
} as const satisfies Resource;
