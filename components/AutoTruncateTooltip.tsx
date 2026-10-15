import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
  placement: 'bottom' | 'top';
}

/**
 * Checks if an element belongs to the sidebar or sidebar container.
 * Tooltips must NOT appear on sidebar items as requested by user.
 */
function isInsideSidebar(target: HTMLElement | null): boolean {
  if (!target) return false;
  if (
    target.closest(
      '#sidebar-container, [data-sidebar], .sidebar, aside, nav#sidebar-nav, #sidebar-header, #sidebar-footer-dashboard'
    )
  ) {
    return true;
  }
  let curr: HTMLElement | null = target;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const id = curr.id ? curr.id.toLowerCase() : '';
    const className = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
    if (
      id.includes('sidebar') ||
      className.includes('sidebar') ||
      curr.getAttribute('data-sidebar') !== null ||
      curr.tagName.toLowerCase() === 'aside'
    ) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

/**
 * Checks whether an element or any of its close ancestors is text-truncated with dots (... / …)
 * either horizontally via CSS text-overflow: ellipsis / truncate,
 * vertically via line-clamp, or explicit dots in abbreviated text.
 * Strictly excludes anything inside the sidebar.
 */
function findTruncatedElement(target: HTMLElement | null): { text: string; el: HTMLElement } | null {
  if (!target || !(target instanceof HTMLElement)) return null;
  if (target.closest('#auto-truncate-tooltip-portal')) return null;

  // STRICT REQUIREMENT: Do not show tooltip when hovering on sidebar
  if (isInsideSidebar(target)) {
    return null;
  }

  // Walk up to 4 levels of ancestors to catch nested spans or containers
  let curr: HTMLElement | null = target;
  let depth = 0;

  while (curr && depth < 4 && curr !== document.body && curr !== document.documentElement) {
    // If any ancestor is inside sidebar, abort immediately
    if (isInsideSidebar(curr)) {
      return null;
    }

    // Skip interactive editable form controls like input/textarea
    const tagName = curr.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || curr.isContentEditable) {
      return null;
    }

    // Skip large structural containers
    if (tagName === 'table' || tagName === 'tbody' || tagName === 'thead' || tagName === 'tr') {
      curr = curr.parentElement;
      depth++;
      continue;
    }

    const titleAttr = (
      curr.getAttribute('title') ||
      curr.getAttribute('data-original-title') ||
      curr.getAttribute('data-full-text') ||
      ''
    ).trim();

    const visibleText = (curr.innerText || curr.textContent || '').trim();
    const fullText = (titleAttr || visibleText).replace(/\s+/g, ' ').trim();

    if (fullText && curr.clientWidth > 0) {
      const style = window.getComputedStyle(curr);

      // Check if element has scrollbars (not a simple truncated label)
      const isScrollContainer =
        (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        !curr.classList.contains('truncate') &&
        style.textOverflow !== 'ellipsis';

      if (!isScrollContainer) {
        // Condition 1: CSS Text-Overflow Ellipsis (renders "..." dots on screen)
        // Must have text-overflow: ellipsis OR Tailwind 'truncate' class AND overflow: hidden / clip
        const hasEllipsisStyle = style.textOverflow === 'ellipsis' || curr.classList.contains('truncate');
        const hasOverflowHiddenX =
          style.overflowX === 'hidden' || style.overflowX === 'clip' || style.overflow === 'hidden';

        // Horizontal overflow: scrollWidth clearly exceeds clientWidth by at least 2px
        const isHorizontalEllipsis =
          hasEllipsisStyle && hasOverflowHiddenX && curr.scrollWidth - curr.clientWidth >= 2;

        // Condition 2: Vertical Line Clamping (renders "..." dots at last clamped line)
        const isLineClamped =
          (style.webkitLineClamp && style.webkitLineClamp !== 'none') ||
          curr.className.includes('line-clamp');
        const isVerticalClampEllipsis =
          isLineClamped && curr.scrollHeight - curr.clientHeight >= 2;

        // Condition 3: Literal dots (... / … / ..) where full text is longer or distinct
        const hasLiteralDots = /(\.{2,}|…)/.test(visibleText);
        const hasLongerFullText = titleAttr.length > 0 && titleAttr !== visibleText && titleAttr.length > visibleText.length;
        const isLiteralDottedTruncation = hasLiteralDots && (hasLongerFullText || isHorizontalEllipsis || isVerticalClampEllipsis);

        // ONLY show if it actually has dots / ellipsis truncation
        if (isHorizontalEllipsis || isVerticalClampEllipsis || isLiteralDottedTruncation) {
          return { text: fullText, el: curr };
        }
      }
    }

    curr = curr.parentElement;
    depth++;
  }

  return null;
}

export const AutoTruncateTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
    placement: 'bottom',
  });

  const activeElementRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      // Cancel pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const target = e.target as HTMLElement | null;
        const truncated = findTruncatedElement(target);

        if (!truncated) {
          // If we had a previously active element with a title, restore it
          if (activeElementRef.current) {
            const storedTitle = activeElementRef.current.getAttribute('data-original-title');
            if (storedTitle) {
              activeElementRef.current.setAttribute('title', storedTitle);
              activeElementRef.current.removeAttribute('data-original-title');
            }
            activeElementRef.current = null;
          }

          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }

        // We have a truncated element!
        const el = truncated.el;
        activeElementRef.current = el;

        // Suppress browser native tooltip to prevent overlapping
        if (el.hasAttribute('title')) {
          const originalTitle = el.getAttribute('title') || '';
          if (originalTitle) {
            el.setAttribute('data-original-title', originalTitle);
            el.removeAttribute('title');
          }
        }

        // Measure tooltip dimensions
        const tooltipEl = tooltipRef.current;
        const tooltipWidth = tooltipEl ? tooltipEl.offsetWidth : 240;
        const tooltipHeight = tooltipEl ? tooltipEl.offsetHeight : 40;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Place below cursor by default
        let placement: 'bottom' | 'top' = 'bottom';
        let posX = e.clientX + 6;
        let posY = e.clientY + 18;

        // If overflowing bottom edge, flip to above cursor
        if (posY + tooltipHeight > viewportHeight - 12) {
          posY = e.clientY - tooltipHeight - 12;
          placement = 'top';
        }

        // If overflowing right edge, shift left
        if (posX + tooltipWidth > viewportWidth - 12) {
          posX = Math.max(12, viewportWidth - tooltipWidth - 12);
        }

        // Ensure posX is never negative
        if (posX < 12) {
          posX = 12;
        }

        setTooltip({
          visible: true,
          text: truncated.text,
          x: posX,
          y: posY,
          placement,
        });
      });
    };

    const handlePointerLeave = () => {
      if (activeElementRef.current) {
        const storedTitle = activeElementRef.current.getAttribute('data-original-title');
        if (storedTitle) {
          activeElementRef.current.setAttribute('title', storedTitle);
          activeElementRef.current.removeAttribute('data-original-title');
        }
        activeElementRef.current = null;
      }
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    const handleScrollOrBlur = () => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('scroll', handleScrollOrBlur, { passive: true, capture: true });
    window.addEventListener('blur', handleScrollOrBlur);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('scroll', handleScrollOrBlur, true);
      window.removeEventListener('blur', handleScrollOrBlur);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  return ReactDOM.createPortal(
    <div
      id="auto-truncate-tooltip-portal"
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        zIndex: 9999999,
        pointerEvents: 'none',
      }}
      className="animate-in fade-in zoom-in-95 duration-150 ease-out transition-opacity"
    >
      <div className="relative bg-slate-900/95 text-slate-100 text-[12px] sm:text-[12.5px] font-bold px-3 py-1.5 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.4)] border border-slate-700/80 backdrop-blur-md max-w-sm sm:max-w-md break-words leading-relaxed select-none">
        {/* Subtle arrow pointer */}
        {tooltip.placement === 'bottom' ? (
          <div className="absolute -top-1.5 left-3 w-3 h-3 bg-slate-900/95 border-t border-l border-slate-700/80 rotate-45 pointer-events-none" />
        ) : (
          <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-slate-900/95 border-b border-r border-slate-700/80 rotate-45 pointer-events-none" />
        )}
        <span className="relative z-10">{tooltip.text}</span>
      </div>
    </div>,
    document.body
  );
};

export default AutoTruncateTooltip;
