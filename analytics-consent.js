(() => {
  const measurementId = 'G-KWMYXHH3Q3';
  const storageKey = 'mhAnalyticsConsentV1';

  function readChoice() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'accepted' || value === 'rejected' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(storageKey, value);
    } catch (error) {
      // Consent still applies for this page if browser storage is unavailable.
    }
  }

  function updateConsent(choice) {
    const accepted = choice === 'accepted';
    window.gtag('consent', 'update', {
      analytics_storage: accepted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted'
    });
  }

  function sendEvent(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({
      page_path: window.location.pathname
    }, params || {}));
  }

  function cleanLabel(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function labelFor(element) {
    if (!element) return '';
    return cleanLabel(
      element.getAttribute('aria-label') ||
      element.getAttribute('data-analytics-label') ||
      element.innerText ||
      element.textContent
    );
  }

  function destinationFor(anchor) {
    try {
      const url = new URL(anchor.href, window.location.href);
      return url.origin === window.location.origin ? url.pathname : url.hostname;
    } catch (error) {
      return '';
    }
  }

  function hostnameFor(anchor) {
    try {
      return new URL(anchor.href, window.location.href).hostname.toLowerCase();
    } catch (error) {
      return '';
    }
  }

  function setupInteractionTracking() {
    document.addEventListener('click', function (event) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const acceptButton = target.closest('.analytics-consent__button--accept');
      const rejectButton = target.closest('.analytics-consent__button--reject');
      if (acceptButton || rejectButton) {
        sendEvent('analytics_consent_choice', {
          choice: acceptButton ? 'accepted' : 'rejected'
        });
        return;
      }

      const privacyTrigger = target.closest('.privacy-choices-trigger');
      if (privacyTrigger) {
        sendEvent('privacy_preferences_opened');
        return;
      }

      const menuToggle = target.closest('.mobile-menu-toggle');
      if (menuToggle) {
        sendEvent('mobile_menu_toggle', {
          action: menuToggle.getAttribute('aria-expanded') === 'true' ? 'open' : 'close'
        });
        return;
      }

      const galleryButton = target.closest('button.ph');
      if (galleryButton) {
        const galleryButtons = Array.from(document.querySelectorAll('button.ph'));
        const image = galleryButton.querySelector('img');
        sendEvent('gallery_image_click', {
          gallery_page: document.title,
          image_label: image ? labelFor(image) : labelFor(galleryButton),
          image_position: galleryButtons.indexOf(galleryButton) + 1
        });
        return;
      }

      const viewer = target.closest('#lb, #clientLightbox');
      if (viewer && (viewer.id === 'lb' || target === viewer || target.closest('.client-lightbox-close'))) {
        sendEvent('gallery_viewer_close', {
          viewer: viewer.id === 'clientLightbox' ? 'commercial_client' : 'portfolio'
        });
        return;
      }

      const anchor = target.closest('a');
      if (anchor) {
        const label = labelFor(anchor);
        const destination = destinationFor(anchor);
        const clientCard = anchor.closest('.client-card');
        const clientListItem = anchor.closest('.client-list');
        const printFigure = anchor.closest('.prints figure');
        const navLink = anchor.closest('nav a');
        const publication = anchor.closest('.press a');
        const channelHref = (anchor.getAttribute('href') || '').toLowerCase();
        const channelHost = hostnameFor(anchor);

        if (printFigure) {
          const caption = printFigure.querySelector('figcaption');
          const firstText = caption && caption.childNodes.length ? caption.childNodes[0].textContent : '';
          sendEvent('print_enquiry_click', {
            print_title: cleanLabel(firstText),
            contact_channel: channelHref.startsWith('mailto:') ? 'email' : 'whatsapp'
          });
          return;
        }

        if (clientCard || clientListItem) {
          const nameElement = anchor.querySelector('.client-name') || anchor.querySelector('img');
          sendEvent('commercial_client_click', {
            client_name: labelFor(nameElement) || label,
            destination: destination
          });
          return;
        }

        if (navLink) {
          sendEvent('portfolio_navigation_click', {
            navigation_item: label,
            destination: destination
          });
          return;
        }

        if (publication) {
          sendEvent('publication_reference_click', {
            publication: label,
            destination: destination
          });
          return;
        }

        if (channelHref.startsWith('mailto:')) {
          sendEvent('contact_action_click', { contact_channel: 'email' });
          return;
        }
        if (channelHost === 'wa.me' || channelHost.endsWith('.wa.me') ||
            channelHost === 'whatsapp.com' || channelHost.endsWith('.whatsapp.com')) {
          sendEvent('contact_action_click', { contact_channel: 'whatsapp' });
          return;
        }
        if (channelHost === 'instagram.com' || channelHost.endsWith('.instagram.com')) {
          sendEvent('contact_action_click', { contact_channel: 'instagram' });
          return;
        }

        if (anchor.classList.contains('tile')) {
          sendEvent('portfolio_section_click', {
            section: label,
            destination: destination
          });
          return;
        }

        if (anchor.classList.contains('btn')) {
          sendEvent('portfolio_call_to_action_click', {
            action_label: label,
            destination: destination
          });
          return;
        }

        const urlIsInternal = destination.startsWith('/');
        sendEvent(urlIsInternal ? 'internal_link_click' : 'external_link_click', {
          link_label: label,
          destination: destination
        });
        return;
      }

      const button = target.closest('button');
      if (button) {
        sendEvent('site_button_click', {
          button_label: labelFor(button)
        });
      }
    });
  }

  function loadGoogleTag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    const savedChoice = readChoice();

    // Advanced Consent Mode: start with analytics and advertising storage denied.
    // This allows limited cookieless measurement signals while consent is denied.
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted'
    });

    if (savedChoice === 'accepted') {
      updateConsent('accepted');
    }

    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
  }

  function createConsentUI() {
    const banner = document.createElement('aside');
    banner.id = 'analytics-consent';
    banner.className = 'analytics-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Analytics privacy choices');
    banner.hidden = true;
    banner.innerHTML = `
      <div class="analytics-consent__inner">
        <div class="analytics-consent__copy">
          <p class="analytics-consent__eyebrow">Privacy choices</p>
          <p class="analytics-consent__message">May we use Google Analytics?</p>
          <p class="analytics-consent__details">We use Google Analytics to understand which pages and links visitors value. Accept allows Analytics cookies for fuller measurement. Reject turns off Analytics cookies, but Google still receives cookieless page and interaction signals—including the type of click and the portfolio section or contact channel involved—for aggregate measurement and modelling. We do not send message contents or URL query strings. Change your choice anytime using Privacy choices in the footer.</p>\n          <a class="analytics-consent__policy" href="privacy.html">Privacy policy</a>
        </div>
        <div class="analytics-consent__actions">
          <button class="analytics-consent__button analytics-consent__button--reject" type="button">Reject analytics cookies</button>
          <button class="analytics-consent__button analytics-consent__button--accept" type="button">Accept analytics cookies</button>
        </div>
      </div>`;

    function closeBanner() {
      banner.hidden = true;
    }

    banner.querySelector('.analytics-consent__button--accept').addEventListener('click', function () {
      saveChoice('accepted');
      updateConsent('accepted');
      closeBanner();
      // Record a full page view after the visitor grants analytics consent.
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    });

    banner.querySelector('.analytics-consent__button--reject').addEventListener('click', function () {
      saveChoice('rejected');
      updateConsent('rejected');
      closeBanner();
    });

    document.body.appendChild(banner);

    const footer = document.querySelector('footer');
    if (footer) {
      const policyLink = document.createElement('a');
      policyLink.className = 'privacy-policy-trigger';
      policyLink.href = 'privacy.html';
      policyLink.textContent = 'Privacy policy';
      footer.appendChild(policyLink);

      const trigger = document.createElement('button');
      trigger.className = 'privacy-choices-trigger';
      trigger.type = 'button';
      trigger.textContent = 'Privacy choices';
      trigger.setAttribute('aria-controls', 'analytics-consent');
      trigger.addEventListener('click', function () {
        banner.hidden = false;
        banner.querySelector('.analytics-consent__button--accept').focus();
      });
      footer.appendChild(trigger);
    }

    return banner;
  }

  loadGoogleTag();
  setupInteractionTracking();

  function initializeConsentUI() {
    const choice = readChoice();
    const banner = createConsentUI();
    if (!choice) banner.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConsentUI, { once: true });
  } else {
    initializeConsentUI();
  }
})();
