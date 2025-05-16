/**
 * Next.js Configuration File
 * 
 * This file contains configuration settings for Next.js build process.
 * - export const dynamic = 'force-dynamic': Forces dynamic rendering for all pages
 *   instead of static generation at build time. This is necessary for pages
 *   that use client-side React hooks like useState, useEffect, etc.
 */

export const dynamic = 'force-dynamic'; 