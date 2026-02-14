import { describe, it, expect } from 'vitest';
import { ResumeGenerationService } from '../src/services/resumeGeneration.service.js';

describe('ResumeGenerationService - markdown experience descriptions', () => {
  const service = new ResumeGenerationService();

  it('passes markdown experience descriptions through to all description placeholders', () => {
    const user = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '1234567890',
      experience: [
        {
          title: 'Software Engineer',
          company: 'RIZQ.AI',
          location: 'Remote',
          startDate: new Date('2023-01-01'),
          current: true,
          description: [
            '- Built data pipelines for job ingestion',
            '- Improved resume matching accuracy by 25%',
            '- Led integration with external automation API',
          ].join('\n'),
        },
      ],
    };

    // @ts-expect-error accessing private method for focused unit testing
    const payload = service.buildDynamicPayload(user, 'Senior Software Engineer', 'Summary here');

    const markdown = user.experience[0].description;

    expect(payload['{{Experience_1_Description}}']).toBe(markdown);
    expect(payload['{{Experience_2_Description}}']).toBeUndefined();

    expect(payload['{{Experience_1_Description}}']).toContain('- Built data pipelines for job ingestion');
    expect(payload['{{Experience_1_Description}}']).toContain('- Improved resume matching accuracy by 25%');
    expect(payload['{{Experience_1_Description}}']).toContain('- Led integration with external automation API');
  });
});

