"use client";

import { useEffect } from "react";

const APP_NAME = "HR Resume Assistant";

/**
 * Hook to set the document title for a page
 *
 * @param title - The page-specific title
 * @param options - Configuration options
 *
 * @example
 * // Sets title to "Dashboard | HR Resume Assistant"
 * usePageTitle("Dashboard");
 *
 * @example
 * // Sets title to just "Custom Title"
 * usePageTitle("Custom Title", { includeAppName: false });
 */
export function usePageTitle(
  title: string,
  options: { includeAppName?: boolean } = {}
) {
  const { includeAppName = true } = options;

  useEffect(() => {
    const fullTitle = includeAppName ? `${title} | ${APP_NAME}` : title;
    document.title = fullTitle;
    console.log(`[PageTitle] Set to: ${fullTitle}`);

    // Cleanup: restore default title on unmount
    return () => {
      document.title = APP_NAME;
    };
  }, [title, includeAppName]);
}

/**
 * Pre-defined page titles for consistency
 */
export const PAGE_TITLES = {
  DASHBOARD: "Dashboard",
  APPLICATIONS: "Applications",
  RESUMES: "Info Doc/Resume Versions",
  TEMPLATES: "Email Templates",
  USERS: "User Management",
  SETTINGS: "Settings",
  PROFILE: "My Profile",
  EMAIL_WARMING: "Email Warming",
  RATE_LIMITS: "Rate Limits",
  COMPANY_INTELLIGENCE: "Company Intelligence",
  FOLLOW_UPS: "Follow-Up Sequences",
  SEND_TIME: "Send Time Optimization",
  LOGIN: "Login",
  REGISTER: "Register",
} as const;
