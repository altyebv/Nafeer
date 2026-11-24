import { describe, it, expect } from 'vitest';
import { renderTemplate } from '@/lib/email/templates/index';

describe('onboarding invite email', () => {
  const link = 'https://nafeer4sudan.site/onboard?token=sample';

  it('distinguishes a direct invitation from an approved application', () => {
    const approved = renderTemplate('onboarding_invite', { name: 'Nura', link });
    const invited = renderTemplate('onboarding_invite', { name: 'Nura', link, isDirectInvite: true });

    expect(approved.subject).toContain('تمت الموافقة');
    expect(invited.subject).toContain('دعوة للانضمام');
    expect(invited.text).toContain('ندعوك للانضمام');
    expect(invited.text).not.toContain('تمت الموافقة على طلبك');
    expect(invited.html).toContain(link);
  });

  it('uses custom message text without changing the secure setup link', () => {
    const email = renderTemplate('onboarding_invite', {
      name: 'Nura',
      link,
      isDirectInvite: true,
      body: 'رسالة مخصصة لهذه الدعوة',
    });

    expect(email.text).toContain('رسالة مخصصة لهذه الدعوة');
    expect(email.html).toContain(link);
  });
});
