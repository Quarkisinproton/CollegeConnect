"use client";

import { useEffect } from 'react';
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals Monitoring Component
 * Tracks Core Web Vitals and reports them to console (or your analytics service)
 * 
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): First paint time
 * - FID (First Input Delay): Interactivity (deprecated, use INP)
 * - INP (Interaction to Next Paint): Responsiveness
 * - LCP (Largest Contentful Paint): Loading performance
 * - TTFB (Time to First Byte): Server response time
 */

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[WebVitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // In production, send to your analytics service
  // Example: Google Analytics
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', metric.name, {
  //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
  //     metric_id: metric.id,
  //     metric_value: metric.value,
  //     metric_delta: metric.delta,
  //     metric_rating: metric.rating,
  //   });
  // }

  // Example: Custom Analytics Endpoint
  // fetch('/api/analytics', {
  //   method: 'POST',
  //   body: JSON.stringify(metric),
  //   headers: { 'Content-Type': 'application/json' },
  // }).catch(console.error);
}

export default function WebVitals() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Track all Core Web Vitals
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onFID(sendToAnalytics);
    onINP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);

    // Custom performance tracking
    if ('PerformanceObserver' in window) {
      // Track long tasks (tasks taking > 50ms)
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('[Performance] Long task detected:', {
                duration: Math.round(entry.duration),
                startTime: Math.round(entry.startTime),
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });

        return () => observer.disconnect();
      } catch (e) {
        // Long task API not supported
      }
    }
  }, []);

  return null; // This component doesn't render anything
}

// Export performance metrics getter for programmatic access
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive - navigation?.fetchStart,
    domComplete: navigation?.domComplete - navigation?.fetchStart,
    loadComplete: navigation?.loadEventEnd - navigation?.fetchStart,
    
    // Paint timing
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
    
    // Memory (if available)
    memory: (performance as any).memory ? {
      usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1048576), // MB
      totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1048576), // MB
      jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576), // MB
    } : null,
  };
}
