/**
 * FarmIQ CropPath client persistence (FIQ-090).
 * Trackers are stored in this browser's localStorage following the same
 * pattern as userState.ts until Supabase persistence lands (FIQ-020).
 */

import { CropPathTracker } from '../services/cropPath/types';

export interface CropPathState {
  trackers: CropPathTracker[];
}

export const EMPTY_CROP_PATH_STATE: CropPathState = { trackers: [] };

const STORAGE_KEY = 'farmiq_croppath_state_v1';

export function getCropPathState(): CropPathState {
  if (typeof window === 'undefined') return EMPTY_CROP_PATH_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CROP_PATH_STATE;
    const parsed = JSON.parse(raw) as CropPathState;
    return { trackers: Array.isArray(parsed.trackers) ? parsed.trackers : [] };
  } catch {
    return EMPTY_CROP_PATH_STATE;
  }
}

export function saveCropPathState(state: CropPathState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded: photos are the bulk. Strip photos from the oldest
    // reports progressively and retry, so tracker text always persists.
    try {
      const stripped: CropPathState = {
        trackers: stripOldestPhotos(state.trackers)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch (err) {
      console.error('Failed to persist CropPath trackers:', err);
    }
  }
}

function stripOldestPhotos(trackers: CropPathTracker[]): CropPathTracker[] {
  let candidates = trackers
    .flatMap((t) => t.reports.filter((r) => r.photos?.length).map((r) => ({ tracker: t, report: r })))
    .sort((a, b) => a.report.submittedAt.localeCompare(b.report.submittedAt));
  let current = trackers;
  while (candidates.length) {
    const { tracker, report } = candidates.shift()!;
    current = current.map((t) =>
      t.id !== tracker.id
        ? t
        : {
            ...t,
            reports: t.reports.map((r) => (r.id === report.id ? { ...r, photos: undefined } : r))
          }
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trackers: current }));
      return current;
    } catch {
      // keep stripping
    }
  }
  return current;
}

export function addOrUpdateTracker(tracker: CropPathTracker): CropPathTracker[] {
  const state = getCropPathState();
  const idx = state.trackers.findIndex((t) => t.id === tracker.id);
  const trackers = [...state.trackers];
  if (idx >= 0) trackers[idx] = tracker;
  else trackers.unshift(tracker);
  saveCropPathState({ trackers });
  return trackers;
}

export function removeTracker(id: string): CropPathTracker[] {
  const state = getCropPathState();
  const trackers = state.trackers.filter((t) => t.id !== id);
  saveCropPathState({ trackers });
  return trackers;
}
