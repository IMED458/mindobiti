// მიმღები მშობლის სუფთა ბიზნეს-ლოგიკა (გამოიყენება store-შიც და ტესტებშიც).
import { FosterParentStatus, MAX_FOSTER_CHILDREN } from '../types';

/** სტატუსი აქტიური ბავშვების რაოდენობის მიხედვით. */
export function computeFosterStatus(activeChildrenCount: number): FosterParentStatus {
  return activeChildrenCount >= 1 ? 'დაქირავებული' : 'რეგისტრირებული';
}

/**
 * შეიძლება თუ არა კიდევ ერთი ბავშვის მიმაგრება.
 * გამონაკლისის გარეშე მაქსიმუმ MAX_FOSTER_CHILDREN (4).
 */
export function canAttachChild(currentActiveCount: number, hasException: boolean): boolean {
  if (hasException) return true;
  return currentActiveCount < MAX_FOSTER_CHILDREN;
}

export { MAX_FOSTER_CHILDREN };
