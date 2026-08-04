import { describe, it, expect } from 'vitest';
import { computeFosterStatus, canAttachChild, MAX_FOSTER_CHILDREN } from './fosterLogic';

describe('computeFosterStatus — სტატუსი ბავშვების რაოდენობის მიხედვით', () => {
  it('0 ბავშვი → რეგისტრირებული', () => {
    expect(computeFosterStatus(0)).toBe('რეგისტრირებული');
  });
  it('1 ბავშვი → დაქირავებული', () => {
    expect(computeFosterStatus(1)).toBe('დაქირავებული');
  });
  it('3 ბავშვი → დაქირავებული', () => {
    expect(computeFosterStatus(3)).toBe('დაქირავებული');
  });
});

describe('canAttachChild — 4-ბავშვის ლიმიტი და გამონაკლისი', () => {
  it('1–4 ბავშვის მიმაგრება ნებადართულია (გამონაკლისის გარეშე)', () => {
    expect(canAttachChild(0, false)).toBe(true);
    expect(canAttachChild(1, false)).toBe(true);
    expect(canAttachChild(2, false)).toBe(true);
    expect(canAttachChild(3, false)).toBe(true);
  });
  it('მე-5 ბავშვი დაბლოკილია, თუ გამონაკლისი გამორთულია', () => {
    expect(canAttachChild(MAX_FOSTER_CHILDREN, false)).toBe(false); // უკვე 4 → მე-5 ვერ
    expect(canAttachChild(5, false)).toBe(false);
  });
  it('მე-5 და შემდგომი ნებადართულია, თუ გამონაკლისი ჩართულია', () => {
    expect(canAttachChild(4, true)).toBe(true);
    expect(canAttachChild(6, true)).toBe(true);
    expect(canAttachChild(10, true)).toBe(true);
  });
  it('MAX_FOSTER_CHILDREN უდრის 4-ს', () => {
    expect(MAX_FOSTER_CHILDREN).toBe(4);
  });
});
