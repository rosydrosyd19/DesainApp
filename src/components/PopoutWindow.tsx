import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoutWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const PopoutWindow: React.FC<PopoutWindowProps> = ({ title, onClose, children }) => {
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const externalWindowRef = useRef<Window | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 1. Inisialisasi jendela popout sekali saja saat komponen di-mount
  useEffect(() => {
    // Buka jendela baru untuk Layar 2 (kompatibel penuh Firefox, Chrome, Edge)
    const dualScreenWindow = window.open(
      '',
      'DenahAppSecondaryWindow',
      'width=1600,height=900,left=100,top=100,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
    );

    if (!dualScreenWindow) {
      alert('Pop-up diblokir oleh browser! Mohon izinkan pop-up (pop-up permissions) di Firefox/Chrome untuk situs ini agar fitur Layar 2 dapat terbuka.');
      onCloseRef.current();
      return;
    }

    externalWindowRef.current = dualScreenWindow;
    const doc = dualScreenWindow.document;

    // Atur judul jendela
    doc.title = `${title} - DenahApp Dual Monitor`;

    // Pastikan tag base href diset agar seluruh aset relatif Vite & fonts dapat diakses
    try {
      let base = doc.querySelector('base');
      if (!base) {
        base = doc.createElement('base');
        base.href = window.location.origin + '/';
        doc.head.appendChild(base);
      }
    } catch (e) {
      console.warn('Gagal set base href:', e);
    }

    // Injeksi style kritis layout 100vw x 100vh tanpa memanggil doc.write() (mencegah premature beforeunload di Firefox)
    try {
      doc.documentElement.style.cssText =
        'width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background-color: #020617 !important;';
      doc.body.style.cssText =
        'width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background-color: #020617 !important; color: #f8fafc !important; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; user-select: none !important; -webkit-user-select: none !important;';

      const resetStyle = doc.createElement('style');
      resetStyle.id = 'dual-monitor-reset-styles';
      resetStyle.textContent = `
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          width: 100vw !important;
          height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: #020617 !important;
          color: #f8fafc !important;
        }
        #dual-monitor-root {
          width: 100vw !important;
          height: 100vh !important;
          position: absolute !important;
          inset: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          background-color: #020617 !important;
        }
      `;
      doc.head.appendChild(resetStyle);
    } catch (e) {
      console.warn('Gagal injeksi reset styles:', e);
    }

    // Salin seluruh stylesheet (Tailwind CSS, fonts, styles) dari jendela utama
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            doc.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = doc.createElement('style');
            Array.from(sheet.cssRules).forEach((rule) => {
              style.appendChild(doc.createTextNode(rule.cssText));
            });
            doc.head.appendChild(style);
          }
        } catch {
          if (sheet.href) {
            const link = doc.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            doc.head.appendChild(link);
          }
        }
      });
    } catch (e) {
      console.warn('Gagal menyalin styleSheets ke layar kedua:', e);
    }

    // Salin juga seluruh tag style langsung (seperti style vite HMR)
    try {
      Array.from(document.querySelectorAll('style')).forEach((st) => {
        if (st.id === 'dual-monitor-reset-styles') return;
        try {
          const cloned = st.cloneNode(true) as HTMLStyleElement;
          doc.head.appendChild(cloned);
        } catch (e) {
          console.warn('Gagal menyalin tag style:', e);
        }
      });
    } catch (e) {
      console.warn('Gagal menyalin querySelectorAll style:', e);
    }

    // Siapkan kontainer React portal
    let rootEl = doc.getElementById('dual-monitor-root') as HTMLDivElement;
    if (!rootEl) {
      rootEl = doc.createElement('div');
      rootEl.id = 'dual-monitor-root';
      doc.body.appendChild(rootEl);
    }
    setContainerEl(rootEl);

    // Deteksi penutupan jendela melalui timer polling interval (sangat stabil di Firefox & Chrome)
    const checkClosedInterval = setInterval(() => {
      if (dualScreenWindow.closed) {
        clearInterval(checkClosedInterval);
        onCloseRef.current();
      }
    }, 500);

    return () => {
      clearInterval(checkClosedInterval);
      if (!dualScreenWindow.closed) {
        dualScreenWindow.close();
      }
      setContainerEl(null);
    };
  }, []); // Hanya run sekali saat mount agar jendela tidak tertutup-buka berulang kali saat parent re-render

  // 2. Perbarui judul jendela jika prop title berubah tanpa me-reload jendela
  useEffect(() => {
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      externalWindowRef.current.document.title = `${title} - DenahApp Dual Monitor`;
    }
  }, [title]);

  if (!containerEl) return null;

  return createPortal(children, containerEl);
};
