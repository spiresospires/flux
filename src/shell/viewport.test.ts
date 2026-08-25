import { describe, it, expect } from 'vitest';
import { classifyViewport, resolveNavMode } from './viewport';

describe('classifyViewport', () => {
  it('classifies phone below 768', () => {
    expect(classifyViewport(0)).toBe('phone');
    expect(classifyViewport(375)).toBe('phone');
    expect(classifyViewport(767)).toBe('phone');
  });

  it('classifies tablet-portrait 768-1023', () => {
    expect(classifyViewport(768)).toBe('tablet-portrait');
    expect(classifyViewport(1023)).toBe('tablet-portrait');
  });

  it('classifies tablet-landscape 1024-1279', () => {
    expect(classifyViewport(1024)).toBe('tablet-landscape');
    expect(classifyViewport(1279)).toBe('tablet-landscape');
  });

  it('classifies desktop at 1280 and above', () => {
    expect(classifyViewport(1280)).toBe('desktop');
    expect(classifyViewport(2560)).toBe('desktop');
  });
});

describe('resolveNavMode', () => {
  it('is always mobile on phone, regardless of collapse preference', () => {
    expect(resolveNavMode('phone', false)).toBe('mobile');
    expect(resolveNavMode('phone', true)).toBe('mobile');
  });

  it('is always rail-icon on tablet-portrait, regardless of collapse preference', () => {
    expect(resolveNavMode('tablet-portrait', false)).toBe('rail-icon');
    expect(resolveNavMode('tablet-portrait', true)).toBe('rail-icon');
  });

  it('follows the collapse preference on tablet-landscape and desktop', () => {
    expect(resolveNavMode('tablet-landscape', false)).toBe('rail');
    expect(resolveNavMode('tablet-landscape', true)).toBe('rail-icon');
    expect(resolveNavMode('desktop', false)).toBe('rail');
    expect(resolveNavMode('desktop', true)).toBe('rail-icon');
  });
});
