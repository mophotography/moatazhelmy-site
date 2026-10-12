(() => {
  const measurementId = 'G-KWMYXHH3Q3';
  const storageKey = 'mhAnalyticsConsentV1';
  const disableFlag = 'ga-disable-' + measurementId;

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
      // The choice still applies for this page even if browser storage is unavailable.
    }
  }

  function loadAnalytics() {
    window[disableFlag] = false;
    if (window.__mhAnalyticsLoaded) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
          page_location: window.location.href,
          page_title: document.title
        });
      }
      return;
    }

    window.__mhAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    tag.onerror = function () {
      window.__mhAnalyticsLoaded = false;
    };
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
          <p class="analytics-consent__details">Analytics helps us understand visits and which portfolio pages are useful. It is optional and will only load if you accept. You can change your choice anytime using “Privacy choices” in the footer.</p>
        </div>
        <div class="analytics-consent__actions">
          <button class="analytics-consent__button analytics-consent__button--reject" type="button">Reject analytics</button>
          <button class="analytics-consent__button analytics-consent__button--accept" type="button">Accept analytics</button>
        </div>
      </div>`;

    function closeBanner() {
      banner.hidden = true;
    }

    banner.querySelector('.analytics-consent__button--accept').addEventListener('click', function () {
      saveChoice('accepted');
      closeBanner();
      loadAnalytics();
    });

    banner.querySelector('.analytics-consent__button--reject').addEventListener('click', function () {
      saveChoice('rejected');
      window[disableFlag] = true;
      closeBanner();
    });

    document.body.appendChild(banner);

    const footer = document.querySelector('footer');
    if (footer) {
      const trigger = document.createElement('button');
      trigger.className = 'privacy-choices-trigger';
      trigger.type = 'button';
      trigger.textContent = 'Privacy choices';
      trigger.setAttribute('aria-controls', 'analytics-consent');
      trigger.addEventListener('click', function () {
        banner.hidden = false;
        window[disableFlag] = true;
        banner.querySelector('.analytics-consent__button--accept').focus();
      });
      footer.appendChild(trigger);
    }

    return banner;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const choice = readChoice();
    window[disableFlag] = choice !== 'accepted';

    const banner = createConsentUI();
    if (choice === 'accepted') {
      loadAnalytics();
    } else if (!choice) {
      banner.hidden = false;
    }
  });
})();
